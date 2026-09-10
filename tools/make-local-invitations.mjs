import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadDesign } from "./design.mjs";
import { privateOutput } from "./prepare-preference.mjs";

export function makeLocalInvitations(perBlock = 4) {
  if (!Number.isInteger(perBlock) || perBlock < 1 || perBlock > 100) throw Error("perBlock must be an integer from 1 to 100.");
  const { blocks, manifest } = loadDesign();
  const invitations = Array.from({ length: perBlock }, (_, round) => blocks.map(block => {
    const participantId = `L-${randomUUID().replaceAll("-", "")}`;
    const url = new URL("https://facadeevaluation.netlify.app/local.html");
    url.searchParams.set("LANG", "es");
    url.searchParams.set("BLOCK_ID", block.set_id);
    url.searchParams.set("LOCAL_ID", participantId);
    return { invitation: `${block.set_id}-${round + 1}`, block_id: block.set_id, participant_id: participantId, url: url.href };
  })).flat();
  return { schema: "facade_local_invitations_v1", private_data: true,
    manifest_fingerprint: manifest.fingerprint, created_at: new Date().toISOString(), invitations };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputArg = process.argv[2];
  if (!outputArg?.endsWith(".json")) throw Error("Usage: node tools/make-local-invitations.mjs PRIVATE_OUTPUT.json [PER_BLOCK=4]");
  const output = privateOutput(outputArg);
  const markdown = privateOutput(output.replace(/\.json$/, ".md"));
  if (fs.existsSync(output) || fs.existsSync(markdown)) throw Error("Invitation files already exist; do not overwrite distributed IDs.");
  const data = makeLocalInvitations(process.argv[3] === undefined ? 4 : Number(process.argv[3]));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(data, null, 2) + "\n", { flag: "wx" });
  fs.writeFileSync(markdown, "# Private Local Invitations\n\nOne link per person, one participation across both recruitment sources. Do not publish this list. Start with one round across all 25 blocks; use coverage reports for top-ups. Links obey localMode and research release checks, not automatic production.\n\n"
    + data.invitations.map(row => `- [${row.invitation}](${row.url})`).join("\n") + "\n", { flag: "wx" });
  console.log(JSON.stringify({ output, markdown, invitations: data.invitations.length }, null, 2));
}
