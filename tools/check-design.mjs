import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";
import { root, loadDesign, connectedComponents } from "./design.mjs";

const { design, scenes, blocks, manifest } = loadDesign();
assert.equal(scenes.length, 50);
assert.equal(blocks.length, 25);
const ids = scenes.map(s => `S${s.scene_id}`);
assert.equal(new Set(ids).size, 50);
const exposure = Object.fromEntries(ids.map(id => [id, 0]));
const padExposure = Object.fromEntries(ids.map(id => [id, 0]));
const edges = [];
const pairs = new Set();
for (const block of blocks) {
  assert.equal(block.pairs.length, 5);
  assert.equal(block.pad_ids.length, 10);
  assert.equal(new Set(block.pad_ids).size, 10);
  for (const id of block.pad_ids) padExposure[id] += 4;
  for (const [pair, a, b] of block.pairs) {
    assert.notEqual(a, b);
    assert(!pairs.has(pair));
    assert(ids.includes(a) && ids.includes(b));
    pairs.add(pair);
    exposure[a] += 4;
    exposure[b] += 4;
    edges.push([a, b]);
  }
}
assert(Object.values(exposure).every(n => n === 20));
assert(Object.values(padExposure).every(n => n === 20));
assert.equal(pairs.size, 125);
assert.equal(connectedComponents(ids, edges).length, 1);
for (const id of ids) assert.equal(new Set(edges.flatMap(([a,b]) => a === id ? [b] : b === id ? [a] : [])).size, 5);

let files = 0;
for (const scene of scenes) {
  assert(scene.main_image.endsWith(`frame_${scene.selected_heading}_f.jpg`));
  assert.equal(scene.context_images.length, 3);
  assert.deepEqual(scene.context_images.map(e => e.heading), [90,180,270].map(offset => (scene.selected_heading + offset) % 360));
  assert(scene.context_images.every(e => !e.url.endsWith(`frame_${scene.selected_heading}.jpg`)));
  for (const url of [scene.main_image, ...scene.context_images.map(e => e.url)]) {
    assert(fs.statSync(path.join(root, url)).size > 0, url);
    files += 1;
  }
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(root, scene.main_image))).digest("hex"), scene.asset_hash);
}
assert.equal(files, 200);

const context = vm.createContext({ window: { location: { search: "" } }, Math, URLSearchParams,
  jsPsychModule: { ParameterType: {} } });
for (const file of ["study_config.js", "scene_manifest.js", "pairs.js", "experiment.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
}
vm.runInContext(`
  for (let i = 0; i < 300; i++) {
    const seed = "test-" + i;
    const original = getPairSet(ACTIVE_PAIR_SETS[i % 25].set_id);
    const first = preparePairList(original, seed);
    if (JSON.stringify(first) !== JSON.stringify(preparePairList(original, seed))) throw Error("Unstable randomization");
    const swaps = first.filter(p => p.a_b_swapped).length;
    if (![2,3].includes(swaps)) throw Error("Unbalanced left/right assignment");
    if (preparePadSceneList(first, seed).length !== 10) throw Error("Incorrect PAD count");
    for (const p of first) {
      for (const side of ["A", "B"]) {
        const image = resolveImage(p["image_" + side + "_id"]);
        if (image.url !== p["image_" + side + "_url"]) throw Error("Side mapping mismatch");
        if (JSON.stringify(image.context_urls) !== JSON.stringify(p["image_" + side + "_context_urls"])) throw Error("Context mapping mismatch");
      }
    }
  }
  let threw = false;
  try { getPairSet("BAD"); } catch { threw = true; }
  if (!threw) throw Error("Invalid block silently accepted");
`, context);

const report = { manifest_fingerprint: manifest.fingerprint, scenes: 50, image_files: files,
  blocks: 25, participants_per_block: 4, total_valid_participants: 100,
  pad_ratings_per_scene: 20, preference_exposures_per_scene: 20,
  distinct_pairs: 125, independent_ratings_per_pair: 4,
  graph_components: 1, opponents_per_scene: 5,
  strict_BIBD: false, geography_verified: scenes.every(s => s.geography_verified),
  note: "Exposure balance requires all 25 blocks to receive four usable independent completions. No ratings have been collected." };
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
