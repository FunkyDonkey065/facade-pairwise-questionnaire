const PROLIFIC_COMPLETION_URL = "https://app.prolific.com/submissions/complete?cc=YOUR_COMPLETION_CODE";

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

function preparePairList(basePairs, seedInput) {
  const pairOrderRandom = createSeededRandom(`${seedInput}|pair-order`);
  const sideRandom = createSeededRandom(`${seedInput}|ab-side`);
  const orderedPairs = shuffleWithRandom(basePairs, pairOrderRandom);
  const sidePattern = shuffleWithRandom(
    orderedPairs.map((_, index) => index < Math.floor(orderedPairs.length / 2)),
    sideRandom
  );

  return orderedPairs.map((pair, index) => {
    const aBSwapped = sidePattern[index];
    const imageA = aBSwapped
      ? {
          id: pair.image_B_id,
          url: pair.image_B_url,
          scene_id: pair.image_B_scene_id,
          selected_heading: pair.image_B_selected_heading,
          context_urls: pair.image_B_context_urls,
          excluded_duplicate: pair.image_B_excluded_duplicate,
          location: pair.image_B_location,
          context: pair.image_B_context
        }
      : {
          id: pair.image_A_id,
          url: pair.image_A_url,
          scene_id: pair.image_A_scene_id,
          selected_heading: pair.image_A_selected_heading,
          context_urls: pair.image_A_context_urls,
          excluded_duplicate: pair.image_A_excluded_duplicate,
          location: pair.image_A_location,
          context: pair.image_A_context
        };
    const imageB = aBSwapped
      ? {
          id: pair.image_A_id,
          url: pair.image_A_url,
          scene_id: pair.image_A_scene_id,
          selected_heading: pair.image_A_selected_heading,
          context_urls: pair.image_A_context_urls,
          excluded_duplicate: pair.image_A_excluded_duplicate,
          location: pair.image_A_location,
          context: pair.image_A_context
        }
      : {
          id: pair.image_B_id,
          url: pair.image_B_url,
          scene_id: pair.image_B_scene_id,
          selected_heading: pair.image_B_selected_heading,
          context_urls: pair.image_B_context_urls,
          excluded_duplicate: pair.image_B_excluded_duplicate,
          location: pair.image_B_location,
          context: pair.image_B_context
        };

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

function pickDimensionOrder(seedInput) {
  const random = createSeededRandom(`${seedInput}|dimension-order`);
  return shuffleWithRandom(["pleasure", "arousal", "dominance", "preference"], random);
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
            <form id="text-entry-form">
              <label class="text-entry-label" for="text-entry-input">${escapeHtml(trial.label)}</label>
              <input
                class="text-entry-input"
                id="text-entry-input"
                name="text_entry"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="${escapeHtml(trial.placeholder)}"
                value="${escapeHtml(trial.initial_value)}"
              />
              <div class="error" id="text-entry-error" hidden>Please enter your Prolific ID.</div>
              <div class="actions">
                <button class="primary-button" type="submit">${escapeHtml(trial.button)}</button>
              </div>
            </form>
          </section>
        </div>`;

      const input = displayElement.querySelector("#text-entry-input");
      input.focus();
      input.select();

      displayElement.querySelector("#text-entry-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const response = input.value.trim();
        if (trial.required && !response) {
          displayElement.querySelector("#text-entry-error").hidden = false;
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
      data: { type: jsPsychModule.ParameterType.OBJECT, default: {} }
    }
  };

  class ChoiceCheckPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(displayElement, trial) {
      const start = performance.now();
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
              <div class="option-grid">${options}</div>
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
        const rt = Math.round(performance.now() - start);
        this.jsPsych.finishTrial({
          ...trial.data,
          choice_index: choiceIndex,
          choice_label: trial.choices[choiceIndex],
          correct: choiceIndex === trial.correct_index,
          rt
        });
      });
    }
  }

  ChoiceCheckPlugin.info = info;
  return ChoiceCheckPlugin;
})();

const jsPsychPairwiseMatrix = (() => {
  const info = {
    name: "pairwise-matrix",
    parameters: {
      pair: { type: jsPsychModule.ParameterType.OBJECT, default: {} },
      trial_index: { type: jsPsychModule.ParameterType.INT, default: 0 },
      trial_count: { type: jsPsychModule.ParameterType.INT, default: 0 },
      dimension_order: { type: jsPsychModule.ParameterType.STRING, array: true, default: [] }
    }
  };

  const dimensionLabels = {
    pleasure: "Pleasure: which facade feels more pleasant within its street context?",
    arousal: "Arousal: which facade feels more visually stimulating within its street context?",
    dominance: "Dominance: which facade feels more legible, open, and easy to feel in control within its street context?",
    preference: "Overall preference: which facade do you prefer as part of this street scene?"
  };

  const defaultDimensionOrder = ["pleasure", "arousal", "dominance", "preference"];

  const options = [
    ["-2", "Strongly A"],
    ["-1", "Slightly A"],
    ["0", "About the same"],
    ["1", "Slightly B"],
    ["2", "Strongly B"]
  ];

  function renderContextThumbs(contextUrls) {
    if (!Array.isArray(contextUrls) || !contextUrls.length) return "";
    const thumbs = contextUrls
      .map(
        (entry) => `
          <figure>
            <img src="${escapeHtml(entry.url)}" alt="Street context heading ${escapeHtml(entry.heading)}" />
            <figcaption>${escapeHtml(entry.heading)}°</figcaption>
          </figure>`
      )
      .join("");
    return `
      <div class="context-thumbs" aria-label="Street context images">
        ${thumbs}
      </div>`;
  }

  class PairwiseMatrixPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(displayElement, trial) {
      const pair = trial.pair;
      const start = performance.now();
      const imageAContextThumbs = renderContextThumbs(pair.image_A_context_urls);
      const imageBContextThumbs = renderContextThumbs(pair.image_B_context_urls);
      const trialDimensions = (trial.dimension_order.length ? trial.dimension_order : defaultDimensionOrder)
        .filter((name) => dimensionLabels[name])
        .map((name) => [name, dimensionLabels[name]]);
      const rows = trialDimensions
        .map(([name, label]) => {
          const radios = options
            .map(
              ([value, text]) => `
                <label>
                  <input type="radio" name="${name}" value="${value}" />
                  ${text}
                </label>`
            )
            .join("");
          return `
            <div class="question-row">
              <div class="question-title">${label}</div>
              <div class="option-grid">${radios}</div>
            </div>`;
        })
        .join("");

      displayElement.innerHTML = `
        <div class="wrap comparison-wrap">
          <section class="panel comparison-panel">
            <div class="comparison-header">
              <div class="progress">Pair ${trial.trial_index + 1} of ${trial.trial_count}</div>
              <div class="progress">Pair ID: ${escapeHtml(pair.pair_id)}</div>
            </div>
            <div class="context-strip">
              <strong>Location/context:</strong> ${escapeHtml(pair.location_context || "Barcelona, Catalonia, Spain")}.
              Compare the marked target facade within the visible street scene, including adjacent buildings, street width,
              ground-floor interface, sidewalk, vegetation, enclosure, and overall visual coherence.
            </div>
            <div class="pair-grid comparison-image-grid">
              <div class="image-panel">
                <div class="image-label"><strong>Image A</strong><span>${escapeHtml(pair.image_A_id)}</span></div>
                <img class="main-facade-image" src="${pair.image_A_url}" alt="Marked main facade image A" />
                ${imageAContextThumbs}
              </div>
              <div class="image-panel">
                <div class="image-label"><strong>Image B</strong><span>${escapeHtml(pair.image_B_id)}</span></div>
                <img class="main-facade-image" src="${pair.image_B_url}" alt="Marked main facade image B" />
                ${imageBContextThumbs}
              </div>
            </div>
            <form id="pair-form" class="comparison-form">
              <div class="question-block">${rows}</div>
              <div class="question-row">
                <div class="question-title">Were you able to compare these two target facades clearly enough?</div>
                <div class="option-grid">
                  <label><input type="radio" name="judgeability" value="yes" />Yes</label>
                  <label><input type="radio" name="judgeability" value="somewhat" />Somewhat</label>
                  <label><input type="radio" name="judgeability" value="no" />No</label>
                </div>
              </div>
              <div class="error" id="pair-error" hidden>Please answer every row before continuing.</div>
              <div class="actions">
                <button class="primary-button" type="submit">Next pair</button>
              </div>
            </form>
          </section>
        </div>`;

      displayElement.querySelector("#pair-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const values = {};
        for (const [name] of trialDimensions) {
          const selected = displayElement.querySelector(`input[name="${name}"]:checked`);
          if (!selected) {
            displayElement.querySelector("#pair-error").hidden = false;
            return;
          }
          values[name] = Number(selected.value);
        }
        const judgeability = displayElement.querySelector('input[name="judgeability"]:checked');
        if (!judgeability) {
          displayElement.querySelector("#pair-error").hidden = false;
          return;
        }

        const rt = Math.round(performance.now() - start);
        this.jsPsych.finishTrial({
          task: "pairwise_facade",
          pair_id: pair.pair_id,
          pair_set_id: pair.set_id,
          source_order_index: pair.source_order_index,
          display_order_index: pair.display_order_index,
          a_b_swapped: pair.a_b_swapped,
          original_image_A_id: pair.original_image_A_id,
          original_image_B_id: pair.original_image_B_id,
          dimension_order: trialDimensions.map(([name]) => name).join("|"),
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
          preference_choice: values.preference,
          pleasure_choice: values.pleasure,
          arousal_choice: values.arousal,
          dominance_choice: values.dominance,
          judgeability: judgeability.value,
          rt
        });
      });
    }
  }

  PairwiseMatrixPlugin.info = info;
  return PairwiseMatrixPlugin;
})();

const prolificPid = getUrlParam("PROLIFIC_PID");
const studyId = getUrlParam("STUDY_ID");
const sessionId = getUrlParam("SESSION_ID");
const forcedSet = getUrlParam("PAIR_SET_ID");
const randomizationSeed = sessionId || prolificPid || Math.random().toString(36).slice(2);
const pairSetId = forcedSet || pickSetFromSession(randomizationSeed);
const pairList = preparePairList(getPairSet(pairSetId), randomizationSeed);
const dimensionOrder = pickDimensionOrder(randomizationSeed);
let effectiveProlificPid = prolificPid;

const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  on_finish: async () => {
    const allData = jsPsych.data.get();
    const csv = allData.csv();
    const json = JSON.stringify(allData.values(), null, 2);
    const submitted = await submitToNetlify({ csv, json });
    showFinalScreen({ submitted, csv, json });
  }
});

jsPsych.data.addProperties({
  prolific_pid: prolificPid,
  prolific_pid_confirmed: "",
  study_id: studyId,
  session_id: sessionId,
  pair_set_id: pairSetId,
  randomization_seed: randomizationSeed,
  dimension_order: dimensionOrder.join("|"),
  survey_version: "facade_pairwise_20260608",
  user_agent: navigator.userAgent,
  screen_width: window.screen.width,
  screen_height: window.screen.height,
  viewport_width: window.innerWidth,
  viewport_height: window.innerHeight
});

async function submitToNetlify({ csv, json }) {
  const payload = {
    "form-name": "facade_pairwise_data",
    prolific_pid: effectiveProlificPid,
    study_id: studyId,
    session_id: sessionId,
    pair_set_id: pairSetId,
    randomization_seed: randomizationSeed,
    dimension_order: dimensionOrder.join("|"),
    payload_json: json,
    payload_csv: csv
  };

  try {
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeFormData(payload)
    });
    return response.ok;
  } catch (error) {
    console.warn("Netlify submission failed", error);
    return false;
  }
}

function downloadText(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function showFinalScreen({ submitted, csv, json }) {
  const target = document.querySelector("#jspsych-target");
  target.innerHTML = `
    <div class="wrap">
      <section class="panel final-box">
        <h1>Thank you</h1>
        ${
          submitted
            ? "<p>Your response has been saved. Please return to Prolific to complete the study.</p>"
            : "<p><strong>Data upload could not be confirmed.</strong> This can happen in local preview or GitHub Pages. For a real Prolific study, deploy on Netlify Forms or another data endpoint before launch.</p>"
        }
        <p class="muted">Prolific ID: <code>${escapeHtml(effectiveProlificPid || "not provided")}</code></p>
        <div class="actions">
          <button class="secondary-button" id="download-csv">Download CSV backup</button>
          <button class="secondary-button" id="download-json">Download JSON backup</button>
          <button class="primary-button" id="finish-prolific">Return to Prolific</button>
        </div>
      </section>
    </div>`;

  document.querySelector("#download-csv").addEventListener("click", () => {
    downloadText(`facade_pairwise_${effectiveProlificPid || "anonymous"}.csv`, csv, "text/csv");
  });
  document.querySelector("#download-json").addEventListener("click", () => {
    downloadText(`facade_pairwise_${effectiveProlificPid || "anonymous"}.json`, json, "application/json");
  });
  document.querySelector("#finish-prolific").addEventListener("click", () => {
    window.location.href = PROLIFIC_COMPLETION_URL;
  });
}

const timeline = [];

timeline.push(
  makeButtonTrial({
    title: "Pairwise visual comparison of urban building facades",
    body: `
      <p>You will compare pairs of urban street-scene images from Barcelona, Catalonia, Spain. For each pair, indicate which target facade you prefer and which target facade feels more pleasant, more visually stimulating, and more legible or controllable within its visible street context.</p>
      <p>This study must be completed on a laptop or desktop computer. Mobile phones and tablets are not suitable because two images need to be compared side by side.</p>
      <p class="muted">Estimated time: 8-9 minutes.</p>
      <h2>Data use and protection</h2>
      <p>Your personal data will be processed by the Universitat Politecnica de Catalunya - BarcelonaTech (UPC), as data controller, in accordance with Regulation (EU) 2016/679, the General Data Protection Regulation (GDPR), and Organic Law 3/2018 on personal data protection and digital rights.</p>
      <p>The purpose of processing is to conduct academic research on visual perception of urban building facades and to validate a computational facade perception model. We will collect your Prolific ID, survey responses, completion information, response time, basic technical information needed to run the online task, and selected demographic information supplied by Prolific or confirmed in the survey where necessary.</p>
      <p>The research dataset will be pseudonymised wherever possible. Your Prolific ID will be used only to verify participation, prevent duplicate submissions, process payment, and link Prolific prescreening variables to survey responses. Analysis and publication will use aggregated or de-identified data only.</p>
      <p>Data may be collected through Prolific and this online experiment platform. The research team will export the data to secure UPC-managed storage as soon as practical and will retain only the data necessary for the research aims. The retention period is [X years, to be confirmed in the ethics/data management plan].</p>
      <p>You may exercise your rights of access, rectification, erasure, objection, restriction of processing, and portability where applicable. For questions about the processing of your data, contact the UPC Data Protection Officer at proteccio.dades@upc.edu, or by post at: Delegada de Proteccio de Dades, Area de Serveis Juridics, Universitat Politecnica de Catalunya, Placa Eusebi Guell 6, Edifici Vertex, planta 2, porta 206, 08034 Barcelona. You may also lodge a complaint with the Catalan Data Protection Authority (APDCAT): https://apdcat.gencat.cat.</p>`,
    data: { screen: "welcome" }
  })
);

timeline.push({
  type: jsPsychChoiceCheck,
  title: "Consent",
  prompt: "Do you consent to take part in this study?",
  choices: [
    "Yes, I am 18 or older, I have read the information, and I consent to participate.",
    "No, I do not consent to participate."
  ],
  correct_index: 0,
  data: { screen: "consent" },
  on_finish: (data) => {
    if (data.choice_index !== 0) {
      jsPsych.endExperiment("You did not provide consent. Please return the study on Prolific.");
    }
  }
});

timeline.push({
  type: jsPsychTextEntry,
  title: "Prolific ID",
  prompt:
    "Please confirm your Prolific ID. If you entered from Prolific, this field should already be filled in. Do not enter your name, email address, or any other personal identifier.",
  label: "Prolific ID",
  placeholder: "Paste your Prolific ID here",
  initial_value: prolificPid,
  button: "Continue",
  data: {
    screen: "prolific_id_entry",
    prolific_pid_from_url: prolificPid
  },
  on_finish: (data) => {
    effectiveProlificPid = data.response;
    data.prolific_pid = effectiveProlificPid;
    data.prolific_pid_confirmed = effectiveProlificPid;
    jsPsych.data.addProperties({
      prolific_pid: effectiveProlificPid,
      prolific_pid_confirmed: effectiveProlificPid
    });
  }
});

timeline.push({
  type: jsPsychChoiceCheck,
  title: "Device check",
  prompt: "What type of device are you using right now?",
  choices: ["Laptop or desktop computer", "Tablet", "Mobile phone", "Other"],
  correct_index: 0,
  data: { screen: "device_check" },
  on_finish: (data) => {
    if (data.choice_index !== 0) {
      jsPsych.endExperiment("This task must be completed on a laptop or desktop computer. Please return the study on Prolific.");
    }
  }
});

timeline.push(
  makeButtonTrial({
    title: "Task instructions",
    body: `
      <p>All images in this task show urban street scenes from <strong>Barcelona, Catalonia, Spain</strong>.</p>
      <p>For each pair, compare the <strong>target building facade</strong> in Image A and Image B as part of its visible street scene. If a facade is marked or outlined, compare the marked target facades.</p>
      <p>Please consider stable contextual features such as adjacent buildings, street width, ground-floor interface, sidewalk, vegetation, enclosure, and overall visual coherence.</p>
      <p>Do not base your answer mainly on temporary or incidental elements such as cars, pedestrians, sky, weather, shadows, or photo quality.</p>
      <p>There are no right or wrong answers. We are interested in your immediate visual impression.</p>`,
    data: { screen: "instructions" }
  })
);

timeline.push({
  type: jsPsychChoiceCheck,
  title: "Comprehension check",
  prompt: "What should your comparisons focus on?",
  choices: [
    "The target building facades in Image A and Image B within their Barcelona street context.",
    "Only the sky and weather.",
    "Only cars, traffic signs, and temporary objects.",
    "Whether the photos are technically perfect."
  ],
  correct_index: 0,
  data: { screen: "comprehension_check" }
});

timeline.push({
  type: jsPsychChoiceCheck,
  title: "Attention check",
  prompt: "This is an attention check. To show that you are reading the questions, please select Image B.",
  choices: ["Image A", "Image B", "About the same"],
  correct_index: 1,
  data: { screen: "attention_check_1" }
});

pairList.forEach((pair, index) => {
  timeline.push({
    type: jsPsychPairwiseMatrix,
    pair,
    trial_index: index,
    trial_count: pairList.length,
    dimension_order: dimensionOrder
  });
});

timeline.push({
  type: jsPsychChoiceCheck,
  title: "Attention check",
  prompt: "This is an attention check. Please select No for this question.",
  choices: ["Yes", "No"],
  correct_index: 1,
  data: { screen: "attention_check_2" }
});

timeline.push(
  makeButtonTrial({
    title: "End of task",
    body: "<p>You have completed the comparison task. On the next screen, your data will be saved and you will be able to return to Prolific.</p>",
    button: "Save responses",
    data: { screen: "pre_finish" }
  })
);

jsPsych.run(timeline);
