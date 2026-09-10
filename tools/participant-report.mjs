import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coverageReport } from "./coverage-report.mjs";
import { participantIdentity } from "./participant-identity.mjs";
import { privateOutput } from "./prepare-preference.mjs";
import { expertiseGroup } from "./expertise-groups.mjs";

export function participantReport(sessions) {
  const coverage = coverageReport(sessions);
  const excluded = new Set(coverage.exclusions.map(row => row.file));
  return { schema: "facade_participants_v1", private_data: true, coverage,
    participants: sessions.filter(session => !excluded.has(session.name)).map(session => {
      const meta = session.rows.find(row => row.manifest_fingerprint);
      const summary = session.rows.find(row => row.record_type === "session_summary");
      const identity = participantIdentity(meta);
      const demographic = session.rows.find(row => row.screen === "demographics");
      const values = Object.fromEntries(["demographics_version", "demographics_status", "age_data_source", "education_data_source",
        "age_band", "education_level", "gender_identity", "design_expertise", "professional_field",
        "built_environment_training", "built_environment_experience", "growing_up_country", "barcelona_residence_duration"]
        .map(key => [key, summary[key] ?? demographic?.[key] ?? "not_collected"]));
      return { participant_key: identity.key, participant_id: identity.id, recruitment_source: identity.source,
        expertise_group: expertiseGroup(values), expertise_group_rule: "self_reported_training_plus_1year_v1",
        recruitment_batch: meta.recruitment_batch || "unrecorded",
        prolific_pid: meta.prolific_pid || "", block_id: meta.pair_set_id,
        participant_language: summary.participant_language, ...values };
    }) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2] || !process.argv[3]) throw Error("Usage: node tools/participant-report.mjs PRIVATE_RESPONSE_DIRECTORY PRIVATE_OUTPUT.json");
  const output = privateOutput(process.argv[3]);
  const sessions = fs.readdirSync(process.argv[2]).filter(name => name.endsWith(".json")).sort().map(name => {
    let rows = JSON.parse(fs.readFileSync(path.join(process.argv[2], name), "utf8").replace(/^\uFEFF/, ""));
    if (typeof rows.payload_json === "string") rows = JSON.parse(rows.payload_json);
    if (!Array.isArray(rows)) throw Error(`${name}: expected a completed trial array or Netlify payload_json.`);
    return { name, rows };
  });
  const data = participantReport(sessions);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(data, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ output, participants: data.participants.length, exclusions: data.coverage.exclusions }, null, 2));
}
