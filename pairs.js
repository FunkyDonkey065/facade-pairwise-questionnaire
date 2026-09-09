"use strict";

const DESIGN = Object.freeze({
  version: "exposure_balanced_50_20260909",
  scenes: 50,
  blocks: 25,
  padPerParticipant: 10,
  pairsPerParticipant: 5,
  validParticipantsPerBlock: 4,
  targetValidParticipants: 100,
  targetPadPerScene: 20,
  targetPreferenceExposurePerScene: 20
});
const SURVEY_SCENES = Array.isArray(window.SURVEY_SCENES) ? window.SURVEY_SCENES : [];
const SCENE_BY_ID = Object.fromEntries(SURVEY_SCENES.map(scene => [`S${scene.scene_id}`, scene]));
const DEFAULT_LOCATION_CONTEXT = "Eixample, Barcelona, Catalonia, Spain";
const DEFAULT_STREET_CONTEXT = "Consider the marked facade within its visible street context.";

function scheduleHash(value) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function buildBalancedBlocks(scenes) {
  if (scenes.length !== DESIGN.scenes || new Set(scenes.map(s => s.scene_id)).size !== DESIGN.scenes) {
    throw new Error("Exactly 50 distinct scenes are required. Rebuild scene_manifest.js.");
  }
  // Five round-robin matchings give each scene five distinct opponents.
  // Each matching is divided into five blocks of ten distinct scenes.
  let ring = [...scenes].sort((a, b) =>
    scheduleHash(`schedule-20260909|${a.scene_id}`) - scheduleHash(`schedule-20260909|${b.scene_id}`)
    || a.scene_id.localeCompare(b.scene_id)).map(s => `S${s.scene_id}`);
  const blocks = [];
  for (let round = 0; round < 5; round += 1) {
    const matching = Array.from({ length: 25 }, (_, i) => [ring[i], ring[49 - i]]);
    for (let group = 0; group < 5; group += 1) {
      const setId = `B${String(blocks.length + 1).padStart(2, "0")}`;
      const pairs = matching.slice(group * 5, group * 5 + 5).map(([a, b]) =>
        [`P_${[a, b].sort().join("__")}`, a, b]);
      blocks.push({ set_id: setId, round: round + 1, pairs, pad_ids: pairs.flatMap(p => p.slice(1)) });
    }
    ring = [ring[0], ring[49], ...ring.slice(1, 49)];
  }
  return blocks;
}

const ACTIVE_PAIR_SETS = buildBalancedBlocks(SURVEY_SCENES);

function resolveImage(imageId) {
  const scene = SCENE_BY_ID[imageId];
  if (!scene) throw new Error(`Unknown scene: ${imageId}`);
  return {
    id: imageId, url: scene.main_image, scene_id: scene.scene_id,
    selected_heading: scene.selected_heading, context_urls: scene.context_images,
    excluded_duplicate: scene.excluded_duplicate || "",
    location: scene.location || DEFAULT_LOCATION_CONTEXT, context: DEFAULT_STREET_CONTEXT
  };
}

function getBlock(setId) {
  const block = ACTIVE_PAIR_SETS.find(b => b.set_id === setId);
  if (!block) throw new Error(`Unknown block: ${setId}. Expected B01-B25.`);
  return block;
}

function buildPair(tuple, setId, index) {
  const [pairId, a, b] = tuple;
  const result = { pair_id: pairId, set_id: setId, source_order_index: index + 1,
    location_context: DEFAULT_LOCATION_CONTEXT, street_context: DEFAULT_STREET_CONTEXT };
  for (const [side, id] of [["A", a], ["B", b]]) {
    const image = resolveImage(id);
    for (const key of ["id", "url", "scene_id", "selected_heading", "context_urls", "excluded_duplicate", "location", "context"]) {
      result[`image_${side}_${key}`] = image[key];
    }
  }
  return result;
}

function getPairSet(setId) {
  return getBlock(setId).pairs.map((p, i) => buildPair(p, setId, i));
}

function pickSetFromSession(sessionId) {
  return ACTIVE_PAIR_SETS[scheduleHash(sessionId || "preview") % DESIGN.blocks].set_id;
}
