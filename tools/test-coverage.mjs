import assert from "node:assert/strict";
import { loadDesign } from "./design.mjs";
import { coverageReport } from "./coverage-report.mjs";

const { blocks, manifest } = loadDesign();
const sessions = blocks.flatMap(block => Array.from({length:4}, (_,i) => {
  const meta = { prolific_pid:`fixture_${block.set_id}_${i}`, study_mode:"production", pair_set_id:block.set_id,
    manifest_fingerprint:manifest.fingerprint };
  const rows = [
    ...block.pad_ids.map(id => ({...meta, task:"pad_likert", image_id:id, pleasure_norm:0, arousal_norm:0,
      dominance_norm:0, judgeability:"yes", image_load_status:"ready"})),
    ...block.pairs.map(([p,a,b]) => ({...meta, task:"pairwise_preference", pair_id:p,
      image_A_id:a, image_B_id:b, preference_choice:0, judgeability:"yes", image_load_status:"ready"})),
    { ...meta,screen:"attention_check_1",correct:true }, { ...meta,screen:"attention_check_2",correct:true },
    { ...meta,record_type:"session_summary",outcome:"complete" }
  ];
  return { name:`synthetic_${block.set_id}_${i}`,rows };
}));
const full = coverageReport(sessions);
assert.equal(full.accepted_unique_participants,100);
assert.equal(full.coverage_target_met,true);
assert.equal(full.preference_graph_components,1);
assert(full.scenes.every(s => s.pad_unique_raters === 20 && s.preference_unique_raters === 20));
assert.equal(coverageReport(sessions.slice(1)).coverage_target_met,false);
assert.equal(coverageReport([...sessions,sessions[0]]).accepted_unique_participants,100);
const skipped = structuredClone(sessions);
skipped[0].rows[0].judgeability = "no";
assert.equal(coverageReport(skipped).coverage_target_met,false);
const failed = structuredClone(sessions);
failed[0].rows.filter(r=>r.screen).forEach(r=>r.correct=false);
assert.equal(coverageReport(failed).accepted_unique_participants,99);
const preview = structuredClone(sessions);
preview.forEach(s=>s.rows.forEach(r=>r.study_mode="preview"));
assert.equal(coverageReport(preview).accepted_unique_participants,0);
const uploadTests = structuredClone(sessions);
uploadTests.forEach(s => { s.name += "_upload_test"; s.rows.forEach(r => { r.study_mode = "upload_test"; r.test_submission = true; }); });
assert.equal(coverageReport(uploadTests).accepted_unique_participants, 0);
assert.equal(coverageReport(uploadTests, { includePreview: true }).accepted_unique_participants, 0);
assert.equal(coverageReport([...sessions, ...uploadTests]).accepted_unique_participants, 100);
const bad = structuredClone(sessions);
bad[0].rows[0].image_id = "wrong";
assert.equal(coverageReport(bad).accepted_unique_participants,99);
console.log("Coverage checks passed: complete quotas, shortfall, duplicates, unjudgeable, attention review, preview and schedule mismatch.");
