"""Synthetic checks only; these are not human validation results."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import numpy as np
from analyze_preference import primary, pair_counts, davidson, analyze, load_inputs


def row(pid, a="A", b="B", choice=-1, block="B01"):
    return dict(participant_id=pid, block_id=block, image_a=a, image_b=b,
                choice=choice, judgeability="yes", language="es")


class PreferenceTests(unittest.TestCase):
    def setUp(self):
        self.ids = ["A", "B", "C"]
        self.records = [row("p" + str(i), a, b, -1 if i % 4 else 0)
                        for i in range(12) for a, b in [("A", "B"), ("B", "C"), ("A", "C")]]
        self.data = dict(schema="facade_preference_v1", manifest_fingerprint="fixture",
                         scene_ids=self.ids, records=self.records)
        self.predictions = dict(manifest_fingerprint="fixture", model_id="synthetic-only",
                                checkpoint_sha256="0" * 64,
                                predictions=[dict(scene_id=s, preference_score=v) for s, v in zip(self.ids, [9, 6, 3])])

    def test_direction_and_ties(self):
        scores = dict(A=8, B=4, C=4)
        result = primary([row("1"), row("2", choice=1), row("3", "B", "C", 2), row("4", choice=0)], scores)
        self.assertEqual(result["concordance"], 0.5)
        self.assertEqual(result["human_tie_rate"], 0.25)
        self.assertEqual(result["exact_model_ties_among_decisive"], 1)
        self.assertEqual(primary([row("1", choice=-2)], scores)["concordance"], 1)
        self.assertIsNone(primary([row("1", choice=0)], scores)["concordance"])

    def test_side_invariance(self):
        reverse = [{**r, "image_a": r["image_b"], "image_b": r["image_a"], "choice": -r["choice"]} for r in self.records]
        for left, right in zip(pair_counts(self.records, self.ids), pair_counts(reverse, self.ids)):
            np.testing.assert_equal(left, right)
        np.testing.assert_allclose(davidson(self.records, self.ids)["latent_scores"], davidson(reverse, self.ids)["latent_scores"])

    def test_ranking_and_disconnection(self):
        result = davidson(self.records, self.ids)
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["ranks"], [1, 2, 3])
        self.assertAlmostEqual(sum(result["latent_scores"]), 0)
        self.assertEqual(davidson([row("1")], self.ids)["status"], "unavailable_disconnected_graph")
        tied = [{**r, "choice": 0} for r in self.records]
        np.testing.assert_allclose(davidson(tied, self.ids)["latent_scores"], 0, atol=1e-6)

    def test_reproducible_bootstrap(self):
        result = analyze(self.data, self.predictions, bootstrap=30, rank_bootstrap=20, seed=6)
        self.assertEqual(result, analyze(self.data, self.predictions, bootstrap=30, rank_bootstrap=20, seed=6))
        self.assertEqual(result["primary"]["concordance"], 1)
        self.assertAlmostEqual(result["secondary_davidson"]["spearman_with_model"], 1)
        self.assertTrue(result["bootstrap"]["participants_resampled_within_blocks"])
        json.dumps(result, allow_nan=False)

    def test_input_guards(self):
        prediction = copy.deepcopy(self.predictions)
        prediction["predictions"][0]["preference_score"] = None
        with self.assertRaises(ValueError): load_inputs(self.data, prediction)
        with self.assertRaises(ValueError): load_inputs(self.data, {**self.predictions, "checkpoint_sha256": "not-a-hash"})
        with self.assertRaises(ValueError): load_inputs(self.data, {**self.predictions, "manifest_fingerprint": "wrong"})
        data = copy.deepcopy(self.data)
        data["records"].append(data["records"][0])
        with self.assertRaises(ValueError): load_inputs(data, self.predictions)
        data = copy.deepcopy(self.data)
        data["records"][0]["choice"] = True
        with self.assertRaises(ValueError): load_inputs(data, self.predictions)
        data["records"][0]["choice"] = -1
        data["records"][0]["block_id"] = "other"
        with self.assertRaises(ValueError): load_inputs(data, self.predictions)

    def test_cli_private_output(self):
        with tempfile.TemporaryDirectory(prefix="facade-synthetic-") as folder:
            folder = Path(folder)
            (folder / "data.json").write_text(json.dumps(self.data), encoding="utf-8")
            (folder / "predictions.json").write_text(json.dumps(self.predictions), encoding="utf-8")
            result = subprocess.run([sys.executable, str(Path(__file__).with_name("analyze_preference.py")),
                str(folder / "data.json"), str(folder / "predictions.json"), "--out", str(folder / "results"),
                "--bootstrap", "20", "--rank-bootstrap", "20"], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue((folder / "results" / "preference_report.json").is_file())
            self.assertTrue((folder / "results" / "pair_counts.csv").is_file())
            self.assertTrue((folder / "results" / "human_ranking.csv").is_file())


if __name__ == "__main__":
    unittest.main()
