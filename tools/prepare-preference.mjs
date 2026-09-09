import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { root, loadDesign } from "./design.mjs";
import { coverageReport } from "./coverage-report.mjs";

export function preparePreference(sessions, { includePreview = false } = {}) {
  const { scenes, manifest } = loadDesign();
  const coverage = coverageReport(sessions, { includePreview });
  const excluded = new Set(coverage.exclusions.map(item => item.file));
  const records = [];
  for (const session of sessions) {
    if (excluded.has(session.name)) continue;
    const meta = session.rows.find(row => row.manifest_fingerprint);
    for (const row of session.rows.filter(row => row.task === "pairwise_preference")) {
      if (!["yes", "somewhat"].includes(row.judgeability) || row.image_load_status !== "ready"
        || ![-2, -1, 0, 1, 2].includes(row.preference_choice)) continue;
      records.push({ participant_id: meta.prolific_pid, block_id: meta.pair_set_id, pair_id: row.pair_id,
        image_a: row.image_A_id, image_b: row.image_B_id, choice: row.preference_choice,
        judgeability: row.judgeability, language: row.response_language || row.participant_language || "unknown" });
    }
  }
  return { schema: "facade_preference_v1", manifest_fingerprint: manifest.fingerprint,
    stimulus_version: manifest.version, private_data: true, contains_preview: includePreview,
    scene_ids: scenes.map(scene => `S${scene.scene_id}`), records, coverage };
}

export function privateOutput(file) {
  const target = path.resolve(file);
  let parent = path.dirname(target);
  const missing = [];
  while (!fs.existsSync(parent)) { missing.unshift(path.basename(parent)); parent = path.dirname(parent); }
  const real = path.join(fs.realpathSync(parent), ...missing, path.basename(target));
  const relative = path.relative(fs.realpathSync(root), real);
  if (!relative || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative))) {
    throw Error("Write model predictions and participant data OUTSIDE the public questionnaire repository.");
  }
  return target;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let output, data;
  if (args[0] === "--template") {
    if (!args[1]) throw Error("Usage: node tools/prepare-preference.mjs --template C:\\PRIVATE\\model-predictions.json");
    output = privateOutput(args[1]);
    const { scenes, manifest } = loadDesign();
    data = { manifest_fingerprint: manifest.fingerprint, model_id: "", checkpoint_sha256: "",
      predictions: scenes.map(scene => ({ scene_id: `S${scene.scene_id}`, preference_score: null })) };
  } else {
    if (!args[0] || !args[1]) throw Error("Usage: node tools/prepare-preference.mjs PRIVATE_RESPONSE_DIRECTORY PRIVATE_OUTPUT.json [--include-preview]");
    output = privateOutput(args[1]);
    const sessions = fs.readdirSync(args[0]).filter(name => name.endsWith(".json")).sort().map(name => {
      let rows = JSON.parse(fs.readFileSync(path.join(args[0], name), "utf8").replace(/^\uFEFF/, ""));
      if (typeof rows.payload_json === "string") rows = JSON.parse(rows.payload_json);
      if (!Array.isArray(rows)) throw Error(`${name}: expected a completed trial array or Netlify payload_json, not a progress backup.`);
      return { name, rows };
    });
    data = preparePreference(sessions, { includePreview: args.includes("--include-preview") });
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(data, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ output, records: data.records?.length, participants: data.coverage?.accepted_unique_participants,
    excluded: data.coverage?.exclusions, template_only: !data.records }, null, 2));
}
