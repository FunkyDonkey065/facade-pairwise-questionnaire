import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { loadDesign, root } from "./design.mjs";
import { coverageReport } from "./coverage-report.mjs";
import { preparePreference } from "./prepare-preference.mjs";
import { participantReport } from "./participant-report.mjs";
import { makeLocalInvitations } from "./make-local-invitations.mjs";

const { blocks, manifest } = loadDesign();
const sessions = blocks.flatMap((block, b) => Array.from({ length: 4 }, (_, i) => {
  const local = i > 0;
  const id = (b * 4 + i + 1).toString(16).padStart(local ? 32 : 24, "0");
  const meta = { participant_id: local ? `L-${id}` : id, prolific_pid: local ? "" : id,
    recruitment_source: local ? "local" : "prolific", pair_set_id: block.set_id,
    study_mode: "production", manifest_fingerprint: manifest.fingerprint, screening_method: "self_report_city_v1" };
  return { name: `fixture_${b}_${i}`, rows: [
    { ...meta, screen: "residence_screening", residence_eligible: true, residence_category: "barcelona_city" },
    ...block.pad_ids.map(id => ({ ...meta, task: "pad_likert", image_id: id, pleasure_norm: 0,
      arousal_norm: 0, dominance_norm: 0, judgeability: "yes", image_load_status: "ready" })),
    ...block.pairs.map(([pair_id, image_A_id, image_B_id]) => ({ ...meta, task: "pairwise_preference",
      pair_id, image_A_id, image_B_id, preference_choice: 1, judgeability: "yes", image_load_status: "ready" })),
    { ...meta, screen: "attention_check_1", correct: true }, { ...meta, screen: "attention_check_2", correct: true },
    { ...meta, screen: "demographics", gender_identity: "not_answered", age_band: local ? "25_34" : "external_pending" },
    { ...meta, record_type: "session_summary", outcome: "complete" }
  ] };
}));
const full = coverageReport(sessions);
const initialBatch = structuredClone(sessions.slice(0, 1));
initialBatch[0].rows.forEach(row => Object.assign(row, { study_phase: 'main', recruitment_batch: 'initial_4', test_submission: false }));
assert.equal(coverageReport(initialBatch).accepted_unique_participants, 1);
assert.equal(preparePreference(initialBatch).records.length, 5);
assert.equal(participantReport(initialBatch).participants.length, 1);
assert.equal(participantReport(initialBatch).participants[0].recruitment_batch, 'initial_4');
assert(preparePreference(initialBatch).records.every(row => row.recruitment_batch === 'initial_4'));
assert.equal(full.coverage_target_met, true);
assert.equal(full.accepted_unique_participants, 100);
assert.deepEqual(full.participants_by_recruitment_source, { prolific: 25, local: 75 });
assert(full.blocks.every(b => b.fully_usable_by_source.local === 3 && b.fully_usable_by_source.prolific === 1));
assert.equal(preparePreference(sessions).records.length, 500);
assert(preparePreference(sessions).records.every(r => r.participant_id.startsWith(`${r.recruitment_source}:`)));
const report = participantReport(sessions);
assert.equal(report.participants.length, 100);
assert.equal(report.participants[0].age_band, "external_pending");
assert.equal(report.participants[1].age_band, "25_34");
assert.equal(report.participants[1].gender_identity, "not_answered");
const duplicate = structuredClone(sessions[1]);
duplicate.name = "duplicate_local";
assert.equal(coverageReport([...sessions, duplicate]).accepted_unique_participants, 100);
assert.equal(preparePreference([...sessions, duplicate]).records.length, 500);
const wrongId = structuredClone(sessions[1]);
wrongId.rows[0].participant_id = "L-" + "f".repeat(32);
assert.equal(coverageReport([wrongId]).exclusions[0].reason, "inconsistent_participant_identity");
const fake = structuredClone(sessions[1]);
fake.rows.forEach(row => row.prolific_pid = "fake");
assert.equal(coverageReport([fake]).accepted_unique_participants, 0);
const tests = structuredClone(sessions);
tests.forEach(s => s.rows.forEach(row => row.test_submission = true));
assert.equal(participantReport(tests).participants.length, 0);

const invitations = makeLocalInvitations();
assert.equal(invitations.invitations.length, 100);
assert.equal(new Set(invitations.invitations.map(row => row.participant_id)).size, 100);
assert(invitations.invitations.every(row => /^L-[a-f0-9]{32}$/.test(row.participant_id)));
assert(invitations.invitations.every(row => new URL(row.url).pathname === "/local.html"));
assert.equal(makeLocalInvitations(3).invitations.length, 75);
assert.throws(() => makeLocalInvitations(0));

const context = { window: {}, jsPsychModule: { ParameterType: { STRING: 1, OBJECT: 2 } } };
vm.runInNewContext(fs.readFileSync(`${root}/demographics.js`, "utf8"), context);
const demo = context.window.SurveyDemographics;
assert.equal(demo.forSource("local").length, 8);
assert.equal(demo.forSource("prolific").length, 8);
assert(demo.forSource("local").every(field => field.options.some(([code]) => code === "prefer_not_to_answer")));
assert.equal(demo.metadata("local").age_band, "not_collected");
assert.equal(demo.metadata("local", { age_band: "not_answered" }).age_band, "not_answered");
assert.equal(demo.metadata("prolific", { gender_identity: "woman" }).age_band, "not_collected");
assert.equal(demo.metadata("prolific", { age_band: "25_34", professional_field: "architecture" }).age_band, "25_34");
assert.equal(demo.metadata("local", { professional_field: "architecture" }).professional_field, "architecture");
const htmlFields = file => [...fs.readFileSync(`${root}/${file}`, "utf8").matchAll(/name="([^"]+)"/g)].map(m => m[1]).sort();
assert.deepEqual(htmlFields("index.html"), htmlFields("local.html"));
for (const file of ["index.html", "local.html"]) {
  const html = fs.readFileSync(`${root}/${file}`, "utf8");
  assert(html.includes('src="demographics.js"'));
  assert(html.includes('name="recruitment_source"'));
}
console.log("Dual recruitment checks passed: mixed 25/75 quotas, source counts, local deduplication, valid identities, participant export, optional demographics, invitation balance and matched form schemas.");
