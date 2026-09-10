import assert from "node:assert/strict";
import path from "node:path";
import { loadDesign, root } from "./design.mjs";
import { preparePreference, privateOutput } from "./prepare-preference.mjs";
const { blocks, manifest } = loadDesign();
const sessions = blocks.flatMap(block => Array.from({ length: 4 }, (_, i) => {
  const meta = { prolific_pid: `synthetic_${block.set_id}_${i}`, pair_set_id: block.set_id,
    study_mode: "production", manifest_fingerprint: manifest.fingerprint };
  return { name: meta.prolific_pid, rows: [
    ...block.pad_ids.map(id => ({ ...meta, task: "pad_likert", image_id: id,
      pleasure_norm: 0, arousal_norm: 0, dominance_norm: 0, judgeability: "yes", image_load_status: "ready" })),
    ...block.pairs.map(([p, a, b]) => ({ ...meta, task: "pairwise_preference", pair_id: p,
      image_A_id: i % 2 ? b : a, image_B_id: i % 2 ? a : b, preference_choice: i % 2 ? 1 : -1,
      judgeability: "yes", image_load_status: "ready", response_language: "es" })),
    { ...meta, screen: "attention_check_1", correct: true }, { ...meta, screen: "attention_check_2", correct: true },
    { ...meta, record_type: "session_summary", outcome: "complete" }
  ] };
}));
const result = preparePreference(sessions);
assert.equal(result.records.length, 500);
assert.equal(result.scene_ids.length, 50);
assert(result.records.every(r => r.block_id && r.language === "es"));
assert.equal(result.records[0].image_a, result.records[5].image_b);
assert.equal(result.records[0].choice, -result.records[5].choice);
const modified = structuredClone(sessions);
modified[0].rows.find(r => r.task === "pairwise_preference").judgeability = "no";
assert.equal(preparePreference(modified).records.length, 499);
const duplicated = structuredClone(sessions[0]);
duplicated.name += "_duplicate";
assert.equal(preparePreference([...sessions, duplicated]).records.length, 500);
const preview = structuredClone(sessions);
preview.forEach(s => s.rows.forEach(r => r.study_mode = "preview"));
assert.equal(preparePreference(preview).records.length, 0);
assert.equal(preparePreference(preview, { includePreview: true }).records.length, 500);
const uploadTests = structuredClone(sessions);
uploadTests.forEach(s => { s.name += "_upload_test"; s.rows.forEach(r => { r.study_mode = "upload_test"; r.test_submission = true; }); });
assert.equal(preparePreference(uploadTests).records.length, 0);
assert.equal(preparePreference(uploadTests, { includePreview: true }).records.length, 0);
assert.equal(preparePreference([...sessions, ...uploadTests]).records.length, 500);
assert.throws(() => privateOutput(path.join(root, "private.json")), /OUTSIDE/);
assert.throws(() => privateOutput(path.join(root, "new-dir", "private.json")), /OUTSIDE/);
assert.equal(privateOutput(path.join(root, "..", "private.json")), path.resolve(root, "..", "private.json"));
console.log("Preference preparation checks passed: 500 synthetic comparisons, A/B identity, missingness, deduplication, preview exclusion and private output guard.");
