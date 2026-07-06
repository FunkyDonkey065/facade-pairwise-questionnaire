function placeholderImage(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <rect width="1200" height="900" fill="#e8e1d3"/>
      <rect x="170" y="130" width="860" height="640" rx="18" fill="#c9d8d0" stroke="#41524a" stroke-width="8"/>
      <g fill="#f7f3ea" stroke="#41524a" stroke-width="5">
        <rect x="250" y="210" width="140" height="150"/>
        <rect x="530" y="210" width="140" height="150"/>
        <rect x="810" y="210" width="140" height="150"/>
        <rect x="250" y="455" width="140" height="150"/>
        <rect x="530" y="455" width="140" height="150"/>
        <rect x="810" y="455" width="140" height="150"/>
      </g>
      <rect x="500" y="655" width="200" height="115" fill="#6f7f77"/>
      <text x="600" y="830" text-anchor="middle" font-family="Arial" font-size="58" fill="#17201c">${label}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const DEFAULT_LOCATION_CONTEXT = "Barcelona, Catalonia, Spain";
const DEFAULT_STREET_CONTEXT =
  "Urban street context: consider the visible adjacent buildings, street width, ground-floor interface, sidewalk, vegetation, enclosure, and overall visual coherence.";

// Optional: add image-specific metadata here when real images are inserted.
// Example:
// F001: {
//   location: "Barcelona, Catalonia, Spain",
//   context: "Narrow mixed-use street with continuous street wall and active ground floor."
// }
const IMAGE_CONTEXT = {};
const SURVEY_SCENES = Array.isArray(window.SURVEY_SCENES) ? window.SURVEY_SCENES : [];
const SCENE_BY_ID = Object.fromEntries(
  SURVEY_SCENES.map((scene) => [`S${scene.scene_id}`, scene])
);

function getImageContext(imageId) {
  const metadata = IMAGE_CONTEXT[imageId] || {};
  return {
    location: metadata.location || DEFAULT_LOCATION_CONTEXT,
    context: metadata.context || DEFAULT_STREET_CONTEXT
  };
}

function buildAutoPairSetsFromScenes(scenes, pairsPerSet = 8) {
  if (!scenes.length) return [];
  const sortedScenes = [...scenes].sort((a, b) => {
    const aId = Number(a.scene_id);
    const bId = Number(b.scene_id);
    if (Number.isFinite(aId) && Number.isFinite(bId)) return aId - bId;
    return String(a.scene_id).localeCompare(String(b.scene_id));
  });
  const sceneIds = sortedScenes.map((scene) => `S${scene.scene_id}`);
  const setCount = Math.max(sortedScenes.length, 2);
  const offset = Math.max(1, Math.floor(sortedScenes.length / 2));

  return Array.from({ length: setCount }, (_, setIndex) => {
    const pairs = Array.from({ length: pairsPerSet }, (_, trialIndex) => {
      const aIndex = (setIndex * pairsPerSet + trialIndex) % sceneIds.length;
      let bIndex = (aIndex + offset + trialIndex * 7) % sceneIds.length;
      if (bIndex === aIndex) bIndex = (bIndex + 1) % sceneIds.length;
      const pairNo = setIndex * pairsPerSet + trialIndex + 1;
      return [`P${String(pairNo).padStart(4, "0")}`, sceneIds[aIndex], sceneIds[bIndex]];
    });
    return {
      set_id: `S${String(setIndex + 1).padStart(2, "0")}`,
      pairs
    };
  });
}

// Replace these examples with your real balanced pair schedule.
// For deployment, keep 10 pairs per set and create enough sets for your target sample.
const PAIR_SETS = [
  {
    set_id: "S01",
    pairs: [
      ["P001", "F001", "F014"],
      ["P002", "F002", "F027"],
      ["P003", "F003", "F041"],
      ["P004", "F004", "F018"],
      ["P005", "F005", "F032"],
      ["P006", "F006", "F045"],
      ["P007", "F007", "F021"],
      ["P008", "F008", "F036"],
      ["P009", "F009", "F049"],
      ["P010", "F010", "F024"]
    ]
  },
  {
    set_id: "S02",
    pairs: [
      ["P011", "F011", "F025"],
      ["P012", "F012", "F038"],
      ["P013", "F013", "F050"],
      ["P014", "F014", "F028"],
      ["P015", "F015", "F042"],
      ["P016", "F016", "F006"],
      ["P017", "F017", "F031"],
      ["P018", "F018", "F044"],
      ["P019", "F019", "F008"],
      ["P020", "F020", "F033"]
    ]
  }
];

const ACTIVE_PAIR_SETS = SURVEY_SCENES.length
  ? buildAutoPairSetsFromScenes(SURVEY_SCENES)
  : PAIR_SETS;

function buildSceneImage(scene, imageId) {
  const imageContext = getImageContext(imageId);
  const contextUrls = Array.isArray(scene.context_images)
    ? scene.context_images.map((entry) => ({
        heading: entry.heading,
        url: entry.url
      }))
    : [];

  return {
    id: imageId,
    url: scene.main_image,
    scene_id: scene.scene_id,
    selected_heading: scene.selected_heading,
    context_urls: contextUrls,
    excluded_duplicate: scene.excluded_duplicate || "",
    location: imageContext.location,
    context: imageContext.context
  };
}

function buildPlaceholderImage(imageId) {
  const imageContext = getImageContext(imageId);
  return {
    id: imageId,
    url: placeholderImage(imageId),
    scene_id: "",
    selected_heading: "",
    context_urls: [],
    excluded_duplicate: "",
    location: imageContext.location,
    context: imageContext.context
  };
}

function resolveImage(imageId) {
  const scene = SCENE_BY_ID[imageId];
  if (scene) return buildSceneImage(scene, imageId);
  return buildPlaceholderImage(imageId);
}

function buildPair(pairTuple, setId, sourceIndex) {
  const [pairId, imageAId, imageBId] = pairTuple;
  const imageA = resolveImage(imageAId);
  const imageB = resolveImage(imageBId);
  return {
    pair_id: pairId,
    set_id: setId,
    source_order_index: sourceIndex + 1,
    location_context: DEFAULT_LOCATION_CONTEXT,
    street_context: DEFAULT_STREET_CONTEXT,
    image_A_id: imageA.id,
    image_A_url: imageA.url,
    image_A_scene_id: imageA.scene_id,
    image_A_selected_heading: imageA.selected_heading,
    image_A_context_urls: imageA.context_urls,
    image_A_excluded_duplicate: imageA.excluded_duplicate,
    image_A_location: imageA.location,
    image_A_context: imageA.context,
    image_B_id: imageB.id,
    image_B_url: imageB.url,
    image_B_scene_id: imageB.scene_id,
    image_B_selected_heading: imageB.selected_heading,
    image_B_context_urls: imageB.context_urls,
    image_B_excluded_duplicate: imageB.excluded_duplicate,
    image_B_location: imageB.location,
    image_B_context: imageB.context

    // For real images, replace the two URL lines above with:
    // image_A_url: `images/${imageAId}.jpg`,
    // image_B_url: `images/${imageBId}.jpg`
  };
}

function getPairSet(setId) {
  const selected = ACTIVE_PAIR_SETS.find((set) => set.set_id === setId) || ACTIVE_PAIR_SETS[0];
  return selected.pairs.map((pair, index) => buildPair(pair, selected.set_id, index));
}

function pickSetFromSession(sessionId) {
  if (!sessionId) return ACTIVE_PAIR_SETS[0].set_id;
  let hash = 0;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) >>> 0;
  }
  return ACTIVE_PAIR_SETS[hash % ACTIVE_PAIR_SETS.length].set_id;
}
