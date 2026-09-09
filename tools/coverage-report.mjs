import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDesign, connectedComponents } from "./design.mjs";

export function coverageReport(sessions, { includePreview = false } = {}) {
  const { scenes, blocks, manifest } = loadDesign();
  const ids = scenes.map(s => `S${s.scene_id}`);
  const sceneData = Object.fromEntries(ids.map(id => [id, { pad: new Set(), preference: new Set(), opponents: new Set() }]));
  const blockData = Object.fromEntries(blocks.map(b => [b.set_id, 0]));
  const seenPeople = new Set();
  const edgeCounts = new Map();
  const exclusions = [];
  for (const { name, rows } of sessions) {
    const summary = rows.find(r => r.record_type === "session_summary");
    const meta = rows.find(r => r.manifest_fingerprint);
    const skip = reason => exclusions.push({ file: name, reason });
    if (!summary || summary.outcome !== "complete" || !meta) { skip("incomplete"); continue; }
    if (meta.study_mode !== "production" && !includePreview) { skip("preview"); continue; }
    if (meta.manifest_fingerprint !== manifest.fingerprint) { skip("different_stimulus_set"); continue; }
    const person = meta.prolific_pid;
    if (!person) { skip("missing_participant_id"); continue; }
    if (seenPeople.has(person)) { skip("duplicate_participant"); continue; }
    const checks = rows.filter(r => /^attention_check_[12]$/.test(r.screen || ""));
    if (new Set(checks.map(r => r.screen)).size !== 2) { skip("missing_attention_checks"); continue; }
    if (checks.filter(r => !r.correct).length >= 2) { skip("two_failed_attention_checks_requires_review"); continue; }
    const block = blocks.find(b => b.set_id === meta.pair_set_id);
    if (!block) { skip("unknown_block"); continue; }
    const pad = rows.filter(r => r.task === "pad_likert");
    const prefs = rows.filter(r => r.task === "pairwise_preference");
    if (pad.length !== 10 || prefs.length !== 5 || new Set(pad.map(r => r.image_id)).size !== 10
      || new Set(prefs.map(r => r.pair_id)).size !== 5
      || pad.some(r => !block.pad_ids.includes(r.image_id))
      || prefs.some(r => !block.pairs.some(([p,a,b]) => p === r.pair_id && [a,b].includes(r.image_A_id) && [a,b].includes(r.image_B_id) && r.image_A_id !== r.image_B_id))) {
      skip("trial_schedule_mismatch"); continue;
    }
    seenPeople.add(person);
    let usable = 0;
    for (const row of pad) {
      if (!["yes", "somewhat"].includes(row.judgeability) || row.image_load_status !== "ready"
        || ![row.pleasure_norm,row.arousal_norm,row.dominance_norm].every(v => typeof v === "number" && Number.isFinite(v) && v >= -1 && v <= 1)) continue;
      sceneData[row.image_id].pad.add(person);
      usable += 1;
    }
    for (const row of prefs) {
      if (!["yes", "somewhat"].includes(row.judgeability) || row.image_load_status !== "ready"
        || ![-2,-1,0,1,2].includes(row.preference_choice)) continue;
      const a = row.image_A_id, b = row.image_B_id;
      sceneData[a].preference.add(person);
      sceneData[b].preference.add(person);
      sceneData[a].opponents.add(b);
      sceneData[b].opponents.add(a);
      const edge = [a,b].sort().join("|");
      edgeCounts.set(edge, (edgeCounts.get(edge) || 0) + 1);
      usable += 1;
    }
    if (usable === 15) blockData[block.set_id] += 1;
  }
  const counts = ids.map(id => ({ image_id: id,
    pad_unique_raters: sceneData[id].pad.size, preference_unique_raters: sceneData[id].preference.size,
    distinct_opponents: sceneData[id].opponents.size,
    pad_shortfall: Math.max(0,20-sceneData[id].pad.size),
    preference_shortfall: Math.max(0,20-sceneData[id].preference.size) }));
  return { manifest_fingerprint: manifest.fingerprint, accepted_unique_participants: seenPeople.size,
    exclusions, scenes: counts, coverage_target_met: counts.every(c => !c.pad_shortfall && !c.preference_shortfall),
    preference_graph_components: connectedComponents(ids, [...edgeCounts.keys()].map(e => e.split("|"))).length,
    pair_counts: Object.fromEntries(edgeCounts),
    blocks: blocks.map(b => ({ block_id: b.set_id, fully_usable_completions: blockData[b.set_id],
      suggested_top_up: Math.max(0, 4-blockData[b.set_id]) })),
    note: "Counts are preliminary quality-control results, not Prolific payment or rejection decisions. Preview data are excluded by default. Check actual scene shortfalls before ordering top-ups." };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error("Usage: node tools/coverage-report.mjs PRIVATE_RESPONSE_DIRECTORY [--include-preview]");
  const directory = path.resolve(process.argv[2]);
  const sessions = fs.readdirSync(directory).filter(f => f.endsWith(".json")).sort().map(name => {
    let data = JSON.parse(fs.readFileSync(path.join(directory,name), "utf8"));
    if (typeof data.payload_json === "string") data = JSON.parse(data.payload_json);
    if (!Array.isArray(data)) throw new Error(`Expected trial array or payload_json: ${name}`);
    return { name, rows: data };
  });
  const report = coverageReport(sessions, { includePreview: process.argv.includes("--include-preview") });
  console.log(JSON.stringify(report, null, 2));
}
