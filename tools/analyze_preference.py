"""Frozen-scene pairwise concordance and exploratory Davidson rankings.

All confidence intervals resample participants, conditional on these stimuli.
Requires numpy and scipy. Never supplies or fabricates missing predictions.
"""
import argparse
import csv
import json
import re
from pathlib import Path

import numpy as np
from scipy.optimize import minimize
from scipy.special import logsumexp
from scipy.stats import rankdata, spearmanr, kendalltau


def load_inputs(data, predictions):
    if data.get("schema") != "facade_preference_v1":
        raise ValueError("Run prepare-preference.mjs first.")
    if data.get("manifest_fingerprint") != predictions.get("manifest_fingerprint"):
        raise ValueError("Model predictions and human responses use different image manifests.")
    if not predictions.get("model_id") or not re.fullmatch(r"[a-fA-F0-9]{64}", predictions.get("checkpoint_sha256", "")):
        raise ValueError("Record the frozen model identifier and checkpoint SHA256 before analysis.")
    ids = data["scene_ids"]
    if len(set(ids)) != len(ids):
        raise ValueError("Duplicate scene IDs.")
    scores = {}
    for item in predictions["predictions"]:
        scene = item["scene_id"]
        score = item["preference_score"]
        if scene in scores or scene not in ids or isinstance(score, bool) or not isinstance(score, (int, float)) or not np.isfinite(score) or not 1 <= score <= 10:
            raise ValueError("Predictions need one finite 1-10 score for every exact scene ID.")
        scores[scene] = score
    if set(scores) != set(ids):
        raise ValueError("Missing scene predictions; no automatic imputation is permitted.")
    seen, person_blocks = set(), {}
    for row in data["records"]:
        if row["image_a"] not in scores or row["image_b"] not in scores or row["image_a"] == row["image_b"] or isinstance(row["choice"], bool) or row["choice"] not in [-2, -1, 0, 1, 2] or not row["participant_id"] or not row.get("block_id") or row.get("judgeability") not in ("yes", "somewhat"):
            raise ValueError("Invalid pairwise record.")
        block = person_blocks.setdefault(row["participant_id"], row["block_id"])
        if block != row["block_id"]:
            raise ValueError("A participant appears in multiple allocation blocks.")
        key = (row["participant_id"], *sorted((row["image_a"], row["image_b"])))
        if key in seen:
            raise ValueError("Duplicate participant/pair record; deduplicate first.")
        seen.add(key)
    return ids, scores


def primary(records, scores):
    decisive = [r for r in records if r["choice"] != 0]
    values, model_ties = [], 0
    for row in decisive:
        difference = scores[row["image_b"]] - scores[row["image_a"]]
        if difference == 0:
            model_ties += 1
            values.append(0.5)
        else:
            values.append(float(np.sign(difference) == np.sign(row["choice"])))
    human_ties = [r for r in records if r["choice"] == 0]
    return {"concordance": float(np.mean(values)) if values else None,
            "decisive_human_choices": len(decisive), "exact_model_ties_among_decisive": model_ties,
            "human_ties": len(human_ties), "human_tie_rate": len(human_ties) / len(records) if records else None,
            "median_model_gap_when_human_tied": float(np.median([abs(scores[r["image_b"]] - scores[r["image_a"]]) for r in human_ties])) if human_ties else None}


def pair_counts(records, ids):
    lookup = {scene: i for i, scene in enumerate(ids)}
    counts = {}
    for row in records:
        a, b = sorted((lookup[row["image_a"]], lookup[row["image_b"]]))
        value = counts.setdefault((a, b), [0, 0, 0])
        winner = None if row["choice"] == 0 else row["image_a"] if row["choice"] < 0 else row["image_b"]
        value[2 if winner is None else 0 if lookup[winner] == a else 1] += 1
    pairs = np.asarray(list(counts), dtype=int).reshape(-1, 2)
    outcomes = np.asarray(list(counts.values()), dtype=float).reshape(-1, 3)
    return pairs, outcomes


def connected(pairs, size):
    adjacency = [set() for _ in range(size)]
    for a, b in pairs:
        adjacency[a].add(b)
        adjacency[b].add(a)
    found, todo = set(), [0] if size else []
    while todo:
        node = todo.pop()
        if node in found:
            continue
        found.add(node)
        todo.extend(adjacency[node] - found)
    return len(found) == size


def davidson(records, ids, ridge=0.001):
    pairs, counts = pair_counts(records, ids)
    n = len(ids)
    if not connected(pairs, n):
        return {"status": "unavailable_disconnected_graph"}
    totals = counts.sum(axis=1)

    def objective(parameters):
        theta = np.r_[parameters[:-1], 0.0]
        tie = parameters[-1]
        a, b = theta[pairs[:, 0]], theta[pairs[:, 1]]
        logits = np.column_stack([a, b, tie + (a + b) / 2])
        logp = logits - logsumexp(logits, axis=1, keepdims=True)
        centered = theta - theta.mean()
        loss = -(counts * logp).sum() + ridge / 2 * (centered @ centered + tie * tie)
        residual = np.exp(logp) * totals[:, None] - counts
        gradient = np.zeros(n)
        np.add.at(gradient, pairs[:, 0], residual[:, 0] + residual[:, 2] / 2)
        np.add.at(gradient, pairs[:, 1], residual[:, 1] + residual[:, 2] / 2)
        gradient += ridge * centered
        return loss, np.r_[gradient[:-1], residual[:, 2].sum() + ridge * tie]

    fit = minimize(objective, np.zeros(n), method="L-BFGS-B", jac=True,
                   bounds=[(-20, 20)] * (n - 1) + [(-12, 12)],
                   options={"maxiter": 2000, "ftol": 1e-11, "gtol": 1e-6})
    if not fit.success:
        return {"status": "unavailable_optimizer_failure", "message": str(fit.message)}
    theta = np.r_[fit.x[:-1], 0.0]
    theta -= theta.mean()
    return {"status": "ok", "latent_scores": theta.tolist(),
            "ranks": rankdata(-theta, method="average").tolist(), "tie_parameter": float(np.exp(fit.x[-1])),
            "ridge": ridge, "bound_reached": bool(np.any(np.abs(fit.x[:-1]) > 19.99) or abs(fit.x[-1]) > 11.99)}


def interval(values):
    return np.quantile(values, [0.025, 0.975], axis=0).tolist() if len(values) >= 20 else None


def analyze(data, predictions, bootstrap=2000, rank_bootstrap=200, seed=20260909):
    ids, scores = load_inputs(data, predictions)
    records = data["records"]
    if not records:
        raise ValueError("No eligible pairwise responses.")
    by_person = {}
    for row in records:
        by_person.setdefault(row["participant_id"], []).append(row)
    groups = list(by_person.values())
    blocks = {}
    for group in groups:
        blocks.setdefault(group[0]["block_id"], []).append(group)
    estimate = primary(records, scores)
    rng = np.random.default_rng(seed)

    def resample():
        # Preserve allocated block sizes and retain each participant's responses together.
        return [row for block in blocks.values()
                for i in rng.integers(0, len(block), len(block)) for row in block[i]]

    concordances, tie_rates = [], []
    for _ in range(bootstrap):
        sample = resample()
        result = primary(sample, scores)
        if result["concordance"] is not None:
            concordances.append(result["concordance"])
        tie_rates.append(result["human_tie_rate"])
    estimate.update({"concordance_ci95": interval(concordances), "human_tie_rate_ci95": interval(tie_rates),
                     "bootstrap_valid_replicates": len(concordances)})
    ranking = davidson(records, ids)
    rankings, correlations = [], []
    model_order = np.asarray([scores[scene] for scene in ids])
    if ranking["status"] == "ok":
        ranking["spearman_with_model"] = float(spearmanr(ranking["latent_scores"], model_order).statistic) if np.ptp(model_order) and np.ptp(ranking["latent_scores"]) else None
        ranking["kendall_tau_b_with_model"] = float(kendalltau(ranking["latent_scores"], model_order).statistic) if np.ptp(model_order) and np.ptp(ranking["latent_scores"]) else None
        for _ in range(rank_bootstrap):
            sample = resample()
            fit = davidson(sample, ids)
            if fit["status"] != "ok":
                continue
            rankings.append(fit["ranks"])
            if np.ptp(model_order) and np.ptp(fit["latent_scores"]):
                correlations.append(float(spearmanr(fit["latent_scores"], model_order).statistic))
        ranking["rank_ci95"] = interval(rankings)
        ranking["spearman_ci95"] = interval(correlations)
        ranking["bootstrap_valid_replicates"] = len(rankings)
        ranking["ranking_uncertainty_available"] = len(rankings) >= 20
    pairs, counts = pair_counts(records, ids)
    return {"analysis_version": "pairwise_concordance_davidson_v1", "manifest_fingerprint": data["manifest_fingerprint"],
            "model_id": predictions["model_id"], "checkpoint_sha256": predictions["checkpoint_sha256"],
            "participants": len(groups), "usable_comparisons": len(records), "scenes": len(ids),
            "contains_preview": data.get("contains_preview", False), "primary": estimate,
            "sensitivity_judgeable_yes_only": primary([r for r in records if r["judgeability"] == "yes"], scores),
            "descriptive_strong_choices": primary([r for r in records if abs(r["choice"]) == 2], scores),
            "secondary_davidson": ranking,
            "scene_ids": ids, "pair_counts": [{"image_a": ids[a], "image_b": ids[b], "a_wins": int(c[0]), "b_wins": int(c[1]), "human_ties": int(c[2])} for (a, b), c in zip(pairs, counts)],
            "bootstrap": {"seed": seed, "participants_resampled_within_blocks": True, "stimuli_fixed": True, "primary_replicates": bootstrap, "ranking_replicates": rank_bootstrap},
            "limitations": ["Intervals are conditional on these fixed scenes, not population intervals for new buildings or cities.",
                            "Strong and slight choices have equal directional weight; no interval-scale interpretation of -2..2.",
                            "Human ties excluded from primary concordance and reported separately; exact model ties receive 0.5.",
                            "Davidson rankings are exploratory and regularized; latent scores are not a human 1-10 scale.",
                            "No model recalibration or preference MAE/RMSE is performed."]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("responses", type=Path)
    parser.add_argument("predictions", type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--bootstrap", type=int, default=2000)
    parser.add_argument("--rank-bootstrap", type=int, default=200)
    parser.add_argument("--seed", type=int, default=20260909)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    if args.out.resolve().is_relative_to(root):
        parser.error("Write results outside the public questionnaire repository.")
    if args.out.exists():
        parser.error("Output already exists; choose a new private output directory.")
    if args.bootstrap < 0 or args.rank_bootstrap < 0:
        parser.error("Bootstrap counts must be nonnegative.")
    report = analyze(json.loads(args.responses.read_text(encoding="utf-8-sig")),
                     json.loads(args.predictions.read_text(encoding="utf-8-sig")),
                     args.bootstrap, args.rank_bootstrap, args.seed)
    args.out.mkdir(parents=True)
    (args.out / "preference_report.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    with (args.out / "pair_counts.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["image_a", "image_b", "a_wins", "b_wins", "human_ties"])
        writer.writeheader()
        writer.writerows(report["pair_counts"])
    ranking = report["secondary_davidson"]
    if ranking["status"] == "ok":
        with (args.out / "human_ranking.csv").open("w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(["scene_id", "rank", "rank_ci95_lower", "rank_ci95_upper", "latent_score_not_1_to_10"])
            for i in np.argsort(ranking["ranks"]):
                ci = ranking["rank_ci95"]
                writer.writerow([report["scene_ids"][i], ranking["ranks"][i], ci[0][i] if ci else "", ci[1][i] if ci else "", ranking["latent_scores"][i]])
    print(json.dumps({"output": str(args.out), "participants": report["participants"], "comparisons": report["usable_comparisons"], "primary": report["primary"], "ranking_status": ranking["status"]}, indent=2))


if __name__ == "__main__":
    main()
