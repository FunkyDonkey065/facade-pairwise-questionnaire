const studyConfig = window.STUDY_CONFIG;
const PROLIFIC_COMPLETION_URL = studyConfig.completionUrl;
const SURVEY_VERSION = "facade_50_dual_recruitment_demographics_20260910";

function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function encodeFormData(data) {
  return new URLSearchParams(data).toString();
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seedInput) {
  let state = hashString(seedInput || Math.random().toString());
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRandom(items, random) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function imageFromPair(pair, side) {
  return {
    id: pair[`image_${side}_id`],
    url: pair[`image_${side}_url`],
    scene_id: pair[`image_${side}_scene_id`],
    selected_heading: pair[`image_${side}_selected_heading`],
    context_urls: pair[`image_${side}_context_urls`],
    excluded_duplicate: pair[`image_${side}_excluded_duplicate`],
    location: pair[`image_${side}_location`],
    context: pair[`image_${side}_context`]
  };
}

function preparePairList(basePairs, seedInput) {
  const pairOrderRandom = createSeededRandom(`${seedInput}|pair-order`);
  const sideRandom = createSeededRandom(`${seedInput}|ab-side`);
  const orderedPairs = shuffleWithRandom(basePairs, pairOrderRandom);
  const swapCount = Math.floor(orderedPairs.length / 2) + (sideRandom() < 0.5 ? 0 : 1);
  const sidePattern = shuffleWithRandom(
    orderedPairs.map((_, index) => index < swapCount),
    sideRandom
  );

  return orderedPairs.map((pair, index) => {
    const aBSwapped = sidePattern[index];
    const imageA = aBSwapped ? imageFromPair(pair, "B") : imageFromPair(pair, "A");
    const imageB = aBSwapped ? imageFromPair(pair, "A") : imageFromPair(pair, "B");

    return {
      ...pair,
      display_order_index: index + 1,
      a_b_swapped: aBSwapped,
      original_image_A_id: pair.image_A_id,
      original_image_B_id: pair.image_B_id,
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
    };
  });
}

function preparePadSceneList(pairList, seedInput) {
  const seen = new Map();
  pairList.forEach((pair) => {
    [imageFromPair(pair, "A"), imageFromPair(pair, "B")].forEach((image) => {
      if (image.id && !seen.has(image.id)) seen.set(image.id, image);
    });
  });
  const random = createSeededRandom(`${seedInput}|pad-scene-order`);
  return shuffleWithRandom([...seen.values()], random).map((scene, index) => ({
    ...scene,
    pad_order_index: index + 1
  }));
}

function pickPadDimensionOrder(seedInput) {
  const random = createSeededRandom(`${seedInput}|pad-dimension-order`);
  return shuffleWithRandom(["pleasure", "arousal", "dominance"], random);
}

function renderContextThumbs(contextUrls) {
  if (!Array.isArray(contextUrls) || !contextUrls.length) return "";
  const thumbs = contextUrls
    .map(
      (entry) => `
        <figure>
          <img src="${escapeHtml(entry.url)}" alt="Street context heading ${escapeHtml(entry.heading)}" tabindex="0" />
          <figcaption>${escapeHtml(entry.relative_view || entry.heading)}${entry.relative_view ? "" : " deg"}</figcaption>
        </figure>`
    )
    .join("");
  return `<div class="context-thumbs" aria-label="Street context images">${thumbs}</div>`;
}

function guardImageForm(displayElement) {
  const images = [...displayElement.querySelectorAll(".image-panel img")];
  const submit = displayElement.querySelector('button[type="submit"]');
  const status = document.createElement("p");
  status.className = "image-load-status";
  status.setAttribute("role", "status");
  submit.parentElement.before(status);
  const started = performance.now();
  const state = { ready: false, readyAt: null, loadMs: null };
  submit.disabled = true;
  const waitForImage = img => new Promise(resolve => {
    let settled = false;
    const finish = ok => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      img.removeEventListener("load", loaded);
      img.removeEventListener("error", failed);
      resolve(ok);
    };
    const loaded = () => finish(img.naturalWidth > 0 && img.naturalHeight > 0);
    const failed = () => finish(false);
    const timer = setTimeout(failed, 20000);
    if (img.complete) loaded();
    else {
      img.addEventListener("load", loaded);
      img.addEventListener("error", failed);
    }
  });
  const check = async () => {
    status.textContent = "Loading images...";
    const results = await Promise.all(images.map(waitForImage));
    if (results.every(Boolean)) {
      state.ready = true;
      state.readyAt = performance.now();
      state.loadMs = Math.round(state.readyAt - started);
      submit.disabled = false;
      status.remove();
    } else {
      status.textContent = "Some images could not load. Please retry before answering. ";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "secondary-button";
      retry.textContent = "Retry images";
      status.append(retry);
      retry.addEventListener("click", () => {
        images.forEach((img, i) => { if (!results[i]) img.src = img.getAttribute("src"); });
        check();
      }, { once: true });
    }
  };
  images.forEach(img => {
    img.title = "Enlarge image";
    img.tabIndex = 0;
    const enlarge = () => {
      const dialog = document.createElement("dialog");
      dialog.className = "image-dialog";
      dialog.innerHTML = `<button type="button" aria-label="Close enlarged image" title="Close">&times;</button><img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" />`;
      document.body.append(dialog);
      dialog.querySelector("button").addEventListener("click", () => dialog.close());
      dialog.addEventListener("close", () => dialog.remove(), { once: true });
      dialog.showModal();
    };
    img.addEventListener("click", enlarge);
    img.addEventListener("keydown", e => { if (e.key === "Enter") enlarge(); });
  });
  check();
  return state;
}

function makeButtonTrial({ title, body, button = "Continue", data = {} }) {
  return {
    type: jsPsychHtmlScreen,
    title,
    body,
    button,
    data
  };
}

const jsPsychHtmlScreen = (() => {
  const info = {
    name: "html-screen",
    parameters: {
      title: { type: jsPsychModule.ParameterType.STRING, default: "" },
      body: { type: jsPsychModule.ParameterType.HTML_STRING, default: "" },
      button: { type: jsPsychModule.ParameterType.STRING, default: "Continue" },
      data: { type: jsPsychModule.ParameterType.OBJECT, default: {} }
    }
  };

  class HtmlScreenPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(displayElement, trial) {
      const start = performance.now();
      displayElement.innerHTML = `
        <div class="wrap">
          <section class="panel">
            <h1>${escapeHtml(trial.title)}</h1>
            <div>${trial.body}</div>
            <div class="actions">
              <button class="primary-button" id="continue-button">${escapeHtml(trial.button)}</button>
            </div>
          </section>
        </div>`;

      displayElement.querySelector("#continue-button").addEventListener("click", () => {
        const rt = Math.round(performance.now() - start);
        this.jsPsych.finishTrial({ ...trial.data, rt });
      });
    }
  }

  HtmlScreenPlugin.info = info;
  return HtmlScreenPlugin;
})();

const jsPsychTextEntry = (() => {
  const info = {
    name: "text-entry",
    parameters: {
      title: { type: jsPsychModule.ParameterType.STRING, default: "" },
      prompt: { type: jsPsychModule.ParameterType.HTML_STRING, default: "" },
      label: { type: jsPsychModule.ParameterType.STRING, default: "" },
      placeholder: { type: jsPsychModule.ParameterType.STRING, default: "" },
      initial_value: { type: jsPsychModule.ParameterType.STRING, default: "" },
      button: { type: jsPsychModule.ParameterType.STRING, default: "Continue" },
      required: { type: jsPsychModule.ParameterType.BOOL, default: true },
      read_only: { type: jsPsychModule.ParameterType.BOOL, default: false },
      validate_prolific_id: { type: jsPsychModule.ParameterType.BOOL, default: false },
      data: { type: jsPsychModule.ParameterType.OBJECT, default: {} }
    }
  };

  class TextEntryPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(displayElement, trial) {
      const start = performance.now();
      displayElement.innerHTML = `
        <div class="wrap">
          <section class="panel">
            <h1>${escapeHtml(trial.title)}</h1>
            <p>${trial.prompt}</p>
            <form id="text-entry-form" novalidate>
              <label class="text-entry-label" for="text-entry-input">${escapeHtml(trial.label)}</label>
              <input
                class="text-entry-input"
                id="text-entry-input"
                name="text_entry"
                type="text"
                aria-describedby="text-entry-error"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="${escapeHtml(trial.placeholder)}"
                value="${escapeHtml(trial.initial_value)}"
                ${trial.required ? "required" : ""}
                ${trial.read_only ? "readonly" : ""}
                ${trial.validate_prolific_id ? 'pattern="[a-fA-F0-9]{24}" maxlength="24"' : ""}
              />
              <div class="error" id="text-entry-error" role="alert" hidden>Please enter your Prolific ID.</div>
              <div class="actions">
                <button class="primary-button" type="submit">${escapeHtml(trial.button)}</button>
              </div>
            </form>
          </section>
        </div>`;

      const input = displayElement.querySelector("#text-entry-input");
      input.focus();
      input.select();
      input.addEventListener("input", () => {
        displayElement.querySelector("#text-entry-error").hidden = true;
        input.removeAttribute("aria-invalid");
      });

      displayElement.querySelector("#text-entry-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const response = input.value.trim();
        if ((trial.required && !response) || (trial.validate_prolific_id && !/^[a-f\d]{24}$/i.test(response))) {
          const error = displayElement.querySelector("#text-entry-error");
          error.textContent = response ? "Please enter a 24-character Prolific ID using numbers and letters a-f." : "Please enter your Prolific ID.";
          error.hidden = false;
          input.setAttribute("aria-invalid", "true");
          input.focus();
          return;
        }
        const rt = Math.round(performance.now() - start);
        this.jsPsych.finishTrial({ ...trial.data, response, rt });
      });
    }
  }

  TextEntryPlugin.info = info;
  return TextEntryPlugin;
})();

const jsPsychChoiceCheck = (() => {
  const info = {
    name: "choice-check",
    parameters: {
      title: { type: jsPsychModule.ParameterType.STRING, default: "" },
      prompt: { type: jsPsychModule.ParameterType.HTML_STRING, default: "" },
      choices: { type: jsPsychModule.ParameterType.STRING, array: true, default: [] },
      correct_index: { type: jsPsychModule.ParameterType.INT, default: 0 },
      max_attempts: { type: jsPsychModule.ParameterType.INT, default: 1 },
      score_response: { type: jsPsychModule.ParameterType.BOOL, default: true },
      data: { type: jsPsychModule.ParameterType.OBJECT, default: {} }
    }
  };

  class ChoiceCheckPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(displayElement, trial) {
      const start = performance.now();
      const attempts = window.surveySession?.draftAttempts() || [];
      const options = trial.choices
        .map(
          (choice, index) => `
            <label>
              <input type="radio" name="choice" value="${index}" />
              ${escapeHtml(choice)}
            </label>`
        )
        .join("");

      displayElement.innerHTML = `
        <div class="wrap">
          <section class="panel">
            <h1>${escapeHtml(trial.title)}</h1>
            <p>${trial.prompt}</p>
            <form id="choice-form">
              <div class="option-grid${trial.score_response ? "" : " screening-options"}">${options}</div>
              <div class="error" id="choice-error" hidden>Please select an option.</div>
              <div class="actions">
                <button class="primary-button" type="submit">Continue</button>
              </div>
            </form>
          </section>
        </div>`;

      displayElement.querySelector("#choice-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const selected = displayElement.querySelector("input[name='choice']:checked");
        if (!selected) {
          displayElement.querySelector("#choice-error").hidden = false;
          return;
        }
        const choiceIndex = Number(selected.value);
        attempts.push(choiceIndex);
        if (trial.score_response && choiceIndex !== trial.correct_index && attempts.length < trial.max_attempts) {
          const error = displayElement.querySelector("#choice-error");
          error.textContent = "Please re-read the instructions above and try once more.";
          error.hidden = false;
          selected.checked = false;
          window.surveySession?.saveAttempts(attempts);
          return;
        }
        const rt = Math.round(performance.now() - start);
        this.jsPsych.finishTrial({
          ...trial.data,
          choice_index: choiceIndex,
          choice_label: trial.choices[choiceIndex],
          ...(trial.score_response ? { correct: choiceIndex === trial.correct_index } : {}),
          attempt_count: attempts.length,
          attempt_choices: attempts.join("|"),
          rt
        });
      });
    }
  }

  ChoiceCheckPlugin.info = info;
  return ChoiceCheckPlugin;
})();

const jsPsychPadLikert = (() => {
  const info = {
    name: "pad-likert",
    parameters: {
      image: { type: jsPsychModule.ParameterType.OBJECT, default: {} },
      trial_index: { type: jsPsychModule.ParameterType.INT, default: 0 },
      trial_count: { type: jsPsychModule.ParameterType.INT, default: 0 },
      dimension_order: { type: jsPsychModule.ParameterType.STRING, array: true, default: [] }
    }
  };

  const labels = {
    pleasure: {
      title: "Pleasure",
      prompt: "How pleasant does this target facade feel within its street context?",
      left: "Very unpleasant",
      right: "Very pleasant"
    },
    arousal: {
      title: "Arousal",
      prompt: "How visually stimulating does this target facade feel?",
      left: "Very calm",
      right: "Very stimulating"
    },
    dominance: {
      title: "Dominance",
      prompt: "How legible, open, and easy to feel in control does this facade context appear?",
      left: "Very confusing/enclosed",
      right: "Very legible/open"
    }
  };

  const scale = [-3, -2, -1, 0, 1, 2, 3];

  class PadLikertPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(displayElement, trial) {
      const image = trial.image;
      const start = performance.now();
      const dimensionOrder = (trial.dimension_order.length ? trial.dimension_order : ["pleasure", "arousal", "dominance"])
        .filter((name) => labels[name]);
      const rows = dimensionOrder
        .map((name) => {
          const item = labels[name];
          const options = scale
            .map(
              (value) => `
                <label>
                  <input type="radio" name="${name}" value="${value}" />
                  <span>${value}</span>
                </label>`
            )
            .join("");
          return `
            <div class="question-row likert-row">
              <div class="question-title">${escapeHtml(item.title)}: ${escapeHtml(item.prompt)}</div>
              <div class="likert-anchors">
                <span>${escapeHtml(item.left)}</span>
                <span>Neutral</span>
                <span>${escapeHtml(item.right)}</span>
              </div>
              <div class="likert-grid">${options}</div>
            </div>`;
        })
        .join("");

      displayElement.innerHTML = `
        <div class="wrap single-wrap">
          <section class="panel single-panel">
            <div class="comparison-header">
              <div class="progress">PAD rating ${trial.trial_index + 1} of ${trial.trial_count}</div>
            </div>
            <div class="context-strip">
              <strong>Location/context:</strong> ${escapeHtml(image.location || "Barcelona, Catalonia, Spain")}.
              Rate the marked target facade as part of the visible street scene.
            </div>
            <div class="single-image-layout">
              <div class="image-panel">
                <div class="image-label"><strong>Target facade</strong></div>
                <img class="single-facade-image" src="${image.url}" alt="Marked target facade" />
                ${renderContextThumbs(image.context_urls)}
              </div>
              <form id="pad-form" class="single-form">
                <div class="question-block">${rows}</div>
                <div class="question-row">
                  <div class="question-title">Were you able to rate this target facade clearly enough?</div>
                  <div class="option-grid judgeability-grid">
                    <label><input type="radio" name="judgeability" value="yes" />Yes</label>
                    <label><input type="radio" name="judgeability" value="somewhat" />Somewhat</label>
                    <label><input type="radio" name="judgeability" value="no" />No</label>
                  </div>
                </div>
                <div class="error" id="pad-error" hidden>Please answer every row before continuing.</div>
                <div class="actions">
                  <button class="primary-button" type="submit">Next image</button>
                </div>
              </form>
            </div>
          </section>
        </div>`;

      const imageState = guardImageForm(displayElement);
      displayElement.querySelector("#pad-form").addEventListener("submit", (event) => {
        event.preventDefault();
        if (!imageState.ready) return;
        const judgeability = displayElement.querySelector('input[name="judgeability"]:checked');
        if (!judgeability) {
          displayElement.querySelector("#pad-error").hidden = false;
          return;
        }
        const values = {};
        for (const name of dimensionOrder) {
          if (judgeability.value === "no") { values[name] = null; continue; }
          const selected = displayElement.querySelector(`input[name="${name}"]:checked`);
          if (!selected) {
            displayElement.querySelector("#pad-error").hidden = false;
            return;
          }
          values[name] = Number(selected.value);
        }
        const rt = Math.round(performance.now() - imageState.readyAt);
        this.jsPsych.finishTrial({
          task: "pad_likert",
          image_id: image.id,
          scene_id: image.scene_id,
          selected_heading: image.selected_heading,
          pad_order_index: image.pad_order_index,
          pad_dimension_order: dimensionOrder.join("|"),
          image_url: image.url.startsWith("data:") ? "placeholder" : image.url,
          context_urls: Array.isArray(image.context_urls)
            ? image.context_urls.map((entry) => `${entry.heading}:${entry.url}`).join("|")
            : "",
          image_location: image.location,
          image_context: image.context,
          excluded_duplicate: image.excluded_duplicate,
          pleasure_likert: values.pleasure,
          arousal_likert: values.arousal,
          dominance_likert: values.dominance,
          pleasure_norm: values.pleasure === null ? null : values.pleasure / 3,
          arousal_norm: values.arousal === null ? null : values.arousal / 3,
          dominance_norm: values.dominance === null ? null : values.dominance / 3,
          judgeability: judgeability.value,
          image_load_status: "ready",
          image_load_ms: imageState.loadMs,
          page_duration_ms: Math.round(performance.now() - start),
          rt
        });
      });
    }
  }

  PadLikertPlugin.info = info;
  return PadLikertPlugin;
})();

const jsPsychPreferencePairwise = (() => {
  const info = {
    name: "preference-pairwise",
    parameters: {
      pair: { type: jsPsychModule.ParameterType.OBJECT, default: {} },
      trial_index: { type: jsPsychModule.ParameterType.INT, default: 0 },
      trial_count: { type: jsPsychModule.ParameterType.INT, default: 0 }
    }
  };

  const options = [
    ["-2", "Strongly A"],
    ["-1", "Slightly A"],
    ["0", "About the same"],
    ["1", "Slightly B"],
    ["2", "Strongly B"]
  ];

  class PreferencePairwisePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(displayElement, trial) {
      const pair = trial.pair;
      const start = performance.now();
      const imageAContextThumbs = renderContextThumbs(pair.image_A_context_urls);
      const imageBContextThumbs = renderContextThumbs(pair.image_B_context_urls);
      const preferenceOptions = options
        .map(
          ([value, text]) => `
            <label>
              <input type="radio" name="preference" value="${value}" />
              ${text}
            </label>`
        )
        .join("");

      displayElement.innerHTML = `
        <div class="wrap comparison-wrap">
          <section class="panel comparison-panel">
            <div class="comparison-header">
              <div class="progress">Preference pair ${trial.trial_index + 1} of ${trial.trial_count}</div>
            </div>
            <div class="context-strip">
              <strong>Location/context:</strong> ${escapeHtml(pair.location_context || "Barcelona, Catalonia, Spain")}.
              Compare only the marked target facades as part of their visible street scenes.
            </div>
            <div class="pair-grid comparison-image-grid">
              <div class="image-panel">
                <div class="image-label"><strong>Image A</strong></div>
                <img class="main-facade-image" src="${pair.image_A_url}" alt="Marked main facade image A" />
                ${imageAContextThumbs}
              </div>
              <div class="image-panel">
                <div class="image-label"><strong>Image B</strong></div>
                <img class="main-facade-image" src="${pair.image_B_url}" alt="Marked main facade image B" />
                ${imageBContextThumbs}
              </div>
            </div>
            <form id="pair-form" class="comparison-form preference-only-form">
              <div class="question-block">
                <div class="question-row">
                  <div class="question-title">Overall preference: which target facade do you prefer as part of this street scene?</div>
                  <div class="option-grid">${preferenceOptions}</div>
                </div>
                <div class="question-row">
                  <div class="question-title">Were you able to compare these two target facades clearly enough?</div>
                  <div class="option-grid judgeability-grid">
                    <label><input type="radio" name="judgeability" value="yes" />Yes</label>
                    <label><input type="radio" name="judgeability" value="somewhat" />Somewhat</label>
                    <label><input type="radio" name="judgeability" value="no" />No</label>
                  </div>
                </div>
              </div>
              <div class="error" id="pair-error" hidden>Please answer every row before continuing.</div>
              <div class="actions">
                <button class="primary-button" type="submit">Next pair</button>
              </div>
            </form>
          </section>
        </div>`;

      const imageState = guardImageForm(displayElement);
      displayElement.querySelector("#pair-form").addEventListener("submit", (event) => {
        event.preventDefault();
        if (!imageState.ready) return;
        const selected = displayElement.querySelector('input[name="preference"]:checked');
        const judgeability = displayElement.querySelector('input[name="judgeability"]:checked');
        if (!judgeability || (!selected && judgeability.value !== "no")) {
          displayElement.querySelector("#pair-error").hidden = false;
          return;
        }
        const preferenceChoice = judgeability.value === "no" ? null : Number(selected.value);
        const preferredImageId =
          preferenceChoice === null ? "not_judgeable" : preferenceChoice < 0 ? pair.image_A_id : preferenceChoice > 0 ? pair.image_B_id : "about_the_same";
        const rt = Math.round(performance.now() - imageState.readyAt);
        this.jsPsych.finishTrial({
          task: "pairwise_preference",
          pair_id: pair.pair_id,
          pair_set_id: pair.set_id,
          source_order_index: pair.source_order_index,
          display_order_index: pair.display_order_index,
          a_b_swapped: pair.a_b_swapped,
          original_image_A_id: pair.original_image_A_id,
          original_image_B_id: pair.original_image_B_id,
          location_context: pair.location_context,
          street_context: pair.street_context,
          image_A_id: pair.image_A_id,
          image_B_id: pair.image_B_id,
          image_A_scene_id: pair.image_A_scene_id,
          image_B_scene_id: pair.image_B_scene_id,
          image_A_selected_heading: pair.image_A_selected_heading,
          image_B_selected_heading: pair.image_B_selected_heading,
          image_A_context_urls: Array.isArray(pair.image_A_context_urls)
            ? pair.image_A_context_urls.map((entry) => `${entry.heading}:${entry.url}`).join("|")
            : "",
          image_B_context_urls: Array.isArray(pair.image_B_context_urls)
            ? pair.image_B_context_urls.map((entry) => `${entry.heading}:${entry.url}`).join("|")
            : "",
          image_A_excluded_duplicate: pair.image_A_excluded_duplicate,
          image_B_excluded_duplicate: pair.image_B_excluded_duplicate,
          image_A_location: pair.image_A_location,
          image_B_location: pair.image_B_location,
          image_A_context: pair.image_A_context,
          image_B_context: pair.image_B_context,
          image_A_url: pair.image_A_url.startsWith("data:") ? "placeholder" : pair.image_A_url,
          image_B_url: pair.image_B_url.startsWith("data:") ? "placeholder" : pair.image_B_url,
          preference_choice: preferenceChoice,
          preferred_image_id: preferredImageId,
          preference_strength: preferenceChoice === null ? null : Math.abs(preferenceChoice),
          judgeability: judgeability.value,
          image_load_status: "ready",
          image_load_ms: imageState.loadMs,
          page_duration_ms: Math.round(performance.now() - start),
          rt
        });
      });
    }
  }

  PreferencePairwisePlugin.info = info;
  return PreferencePairwisePlugin;
})();

