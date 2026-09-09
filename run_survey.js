"use strict";

const prolificPid = getUrlParam("PROLIFIC_PID");
const studyId = getUrlParam("STUDY_ID");
const sessionId = getUrlParam("SESSION_ID");
const forcedSet = getUrlParam("BLOCK_ID") || getUrlParam("PAIR_SET_ID");
const isProduction = studyConfig.mode === "production";
const randomizationSeed = sessionId || prolificPid || Math.random().toString(36).slice(2);
const pairSetId = forcedSet && ACTIVE_PAIR_SETS.some(b => b.set_id === forcedSet)
  ? forcedSet : pickSetFromSession(randomizationSeed);
const pairList = preparePairList(getPairSet(pairSetId), randomizationSeed);
const padDimensionOrder = pickPadDimensionOrder(randomizationSeed);
const padSceneList = preparePadSceneList(pairList, randomizationSeed);
const taskOrder = createSeededRandom(`${randomizationSeed}|task-order`)() < 0.5
  ? "pad_first" : "preference_first";
let effectiveProlificPid = prolificPid;
let outcome = "in_progress";
let submissionInFlight = false;
const submissionKey = `${SURVEY_VERSION}|${prolificPid || randomizationSeed}|${sessionId}|${pairSetId}`;

function launchIssues() {
  const issues = [];
  if (!["preview", "production"].includes(studyConfig.mode)) issues.push("Invalid study mode.");
  if (forcedSet && !ACTIVE_PAIR_SETS.some(b => b.set_id === forcedSet)) issues.push("BLOCK_ID must be B01-B25.");
  if (isProduction) {
    if (!forcedSet) issues.push("A fixed BLOCK_ID is required for quota allocation.");
    if (!/^[a-f\d]{24}$/i.test(prolificPid) || !studyId || !sessionId) issues.push("The Prolific study link is incomplete.");
    if (getUrlParam("PAD_TRIAL_LIMIT")) issues.push("PAD_TRIAL_LIMIT is not allowed in the fixed study design.");
    for (const name of ["geographyVerified", "independentStimuliVerified", "imageUseReviewed", "participantInformationApproved", "collectorPilotVerified"]) {
      if (studyConfig[name] !== true) issues.push(`Researcher review incomplete: ${name}.`);
    }
    if (SURVEY_SCENES.some(s => !s.geography_verified)) issues.push("Scene locations have not been verified.");
    if (!studyConfig.retentionPeriod || !studyConfig.researchContact || !studyConfig.ethicsReference) issues.push("Participant information is incomplete.");
    if (!/^https:\/\/app\.prolific\.com\/submissions\/complete\?cc=[A-Za-z0-9]+$/.test(PROLIFIC_COMPLETION_URL)
      || PROLIFIC_COMPLETION_URL.includes("YOUR")) issues.push("Set the real Prolific completion URL.");
    if (studyConfig.collectionPlatform !== "netlify_forms" || studyConfig.submissionEndpoint !== "/") issues.push("The configured collector is not supported by this build.");
    if (location.hostname.endsWith("github.io") || ["localhost", "127.0.0.1"].includes(location.hostname)
      || location.protocol !== "https:") issues.push("Use the tested HTTPS collection host for formal data collection.");
  }
  return issues;
}

function showStopped() {
  const messages = {
    no_consent: "You did not consent to participate. No response data has been uploaded. Please return the study on Prolific.",
    comprehension_return: "Please close this survey and return your submission using Cancel participation on Prolific. No response data has been uploaded.",
    technical_stop: "The task cannot run on this screen. Please contact the researcher through Prolific. No response data has been uploaded."
  };
  document.querySelector("#jspsych-target").innerHTML = `<div class="wrap"><section class="panel"><h1>Study ended</h1><p>${escapeHtml(messages[outcome] || "The study did not finish. No response data has been uploaded.")}</p></section></div>`;
}

const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  on_finish: async () => {
    if (outcome !== "complete") { showStopped(); return; }
    const rows = jsPsych.data.get().values();
    const attentionFailCount = rows.filter(r => /^attention_check_[12]$/.test(r.screen || "") && !r.correct).length;
    const summary = {
      record_type: "session_summary", outcome, attention_fail_count: attentionFailCount,
      attention_review_flag: attentionFailCount >= 2,
      completed_pad_trials: rows.filter(r => r.task === "pad_likert").length,
      usable_pad_trials: rows.filter(r => r.task === "pad_likert" && r.judgeability !== "no").length,
      completed_preference_trials: rows.filter(r => r.task === "pairwise_preference").length,
      usable_preference_trials: rows.filter(r => r.task === "pairwise_preference" && r.judgeability !== "no").length,
      completed_at: new Date().toISOString()
    };
    jsPsych.data.addProperties({ attention_fail_count: attentionFailCount });
    Object.assign(rows.find(r => r.screen === "pre_finish"), summary);
    const csv = jsPsych.data.get().csv();
    const json = JSON.stringify(jsPsych.data.get().values(), null, 2);
    showFinalScreen({ status: isProduction ? "saving" : "preview", csv, json });
    if (isProduction) {
      const saved = await submitToNetlify({ csv, json, attentionFailCount });
      showFinalScreen({ status: saved ? "saved" : "failed", csv, json });
    }
  }
});

jsPsych.data.addProperties({
  prolific_pid: prolificPid, study_id: studyId, session_id: sessionId,
  pair_set_id: pairSetId, allocation_method: forcedSet ? "fixed_block" : "preview_hash",
  randomization_seed: randomizationSeed, task_order: taskOrder,
  pad_dimension_order: padDimensionOrder.join("|"),
  pad_scene_order: padSceneList.map(s => s.id).join("|"),
  survey_version: SURVEY_VERSION, design_version: DESIGN.version,
  manifest_fingerprint: window.STIMULUS_MANIFEST.fingerprint,
  stimulus_manifest_version: window.STIMULUS_MANIFEST.version,
  study_mode: studyConfig.mode, submission_key: submissionKey,
  participant_language: studyConfig.participantLanguage,
  user_agent: navigator.userAgent, screen_width: window.screen.width, screen_height: window.screen.height,
  viewport_width: window.innerWidth, viewport_height: window.innerHeight
});

async function submitToNetlify({ csv, json, attentionFailCount }) {
  if (!isProduction || outcome !== "complete" || submissionInFlight) return false;
  submissionInFlight = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(studyConfig.submissionEndpoint, {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeFormData({
        "form-name": "facade_pairwise_data", prolific_pid: effectiveProlificPid,
        study_id: studyId, session_id: sessionId, pair_set_id: pairSetId,
        randomization_seed: randomizationSeed, task_order: taskOrder,
        pad_dimension_order: padDimensionOrder.join("|"),
        pad_scene_order: padSceneList.map(s => s.id).join("|"),
        survey_version: SURVEY_VERSION, study_mode: studyConfig.mode,
        manifest_fingerprint: window.STIMULUS_MANIFEST.fingerprint,
        attention_fail_count: attentionFailCount, submission_key: submissionKey,
        payload_json: json, payload_csv: csv
      })
    });
    return response.ok;
  } catch (error) {
    console.warn("Response upload not confirmed", error);
    return false;
  } finally {
    clearTimeout(timeout);
    submissionInFlight = false;
  }
}

function downloadText(filename, text, mimeType) {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showFinalScreen({ status, csv, json }) {
  const messages = {
    preview: "This preview is complete. Responses have not been uploaded. You can download them to check the study design.",
    saving: "Saving your responses. Please keep this page open.",
    saved: "Your responses have been submitted. Please return to Prolific to complete the study.",
    failed: "Your responses could not be saved. Please retry. If the problem continues, contact the researcher through Prolific and submit with NOCODE so the technical issue can be reviewed."
  };
  document.querySelector("#jspsych-target").innerHTML = `<div class="wrap"><section class="panel final-box">
    <h1>${status === "saving" ? "Saving responses" : "Thank you"}</h1>
    <p>${messages[status]}</p><div class="actions">
      ${status !== "saving" ? '<button class="secondary-button" id="download-json">Download response backup</button>' : ""}
      ${status === "preview" ? '<button class="secondary-button" id="download-csv">Download CSV</button>' : ""}
      ${status === "failed" ? '<button class="primary-button" id="retry-save">Retry saving</button>' : ""}
      ${status === "saved" ? '<button class="primary-button" id="finish-prolific">Return to Prolific</button>' : ""}
    </div></section></div>`;
  document.querySelector("#download-json")?.addEventListener("click", () => downloadText(`facade_${pairSetId}_${effectiveProlificPid || "preview"}.json`, json, "application/json"));
  document.querySelector("#download-csv")?.addEventListener("click", () => downloadText(`facade_${pairSetId}_${effectiveProlificPid || "preview"}.csv`, csv, "text/csv"));
  document.querySelector("#finish-prolific")?.addEventListener("click", () => { window.location.href = PROLIFIC_COMPLETION_URL; });
  document.querySelector("#retry-save")?.addEventListener("click", async () => {
    showFinalScreen({ status: "saving", csv, json });
    const summary = JSON.parse(json).find(r => r.record_type === "session_summary");
    const saved = await submitToNetlify({ csv, json, attentionFailCount: summary.attention_fail_count });
    showFinalScreen({ status: saved ? "saved" : "failed", csv, json });
  });
}

const timeline = [];
timeline.push(makeButtonTrial({
  title: "Facade perception survey",
  body: `<p>You will view 10 target facades with their surrounding street views. You will rate each facade on three scales and compare five pairs for overall preference.</p>
    <p>Please use a laptop or desktop computer. Estimated time: ${escapeHtml(studyConfig.estimatedMinutes)} minutes.</p>
    <h2>Data use and protection</h2>
    <p>The Universitat Politecnica de Catalunya - BarcelonaTech (UPC) is the proposed data controller for this academic research on visual perception of building facades. Processing is subject to the General Data Protection Regulation (EU) 2016/679 and Organic Law 3/2018.</p>
    <p>Taking part is voluntary. You may stop at any time by closing the survey. Contact the research team through Prolific if you wish to request withdrawal of an identifiable response before it is de-identified.</p>
    <p>The study records your Prolific ID, answers, response times and basic device information. Selected demographic information will be supplied by Prolific. Your ID links these records and supports participation checks and payment. Published results will be aggregated or de-identified.</p>
    <p>${isProduction ? "Responses are submitted using Netlify Forms and exported to restricted research storage." : "This is a preview. Your responses remain in this page unless you download them; they are not uploaded."}</p>
    <p>Retention period: ${escapeHtml(studyConfig.retentionPeriod || "To be confirmed before participant recruitment.")}</p>
    <p>Research contact: ${escapeHtml(studyConfig.researchContact || "To be confirmed before participant recruitment.")}<br>Ethics approval or exemption reference: ${escapeHtml(studyConfig.ethicsReference || "To be confirmed before participant recruitment.")}</p>
    <p>Data protection enquiries: <a href="mailto:proteccio.dades@upc.edu">proteccio.dades@upc.edu</a>. You may exercise applicable data protection rights and contact the <a href="https://apdcat.gencat.cat">Catalan Data Protection Authority</a>.</p>`,
  data: { screen: "welcome" }
}));
timeline.push({
  type: jsPsychChoiceCheck, title: "Consent", prompt: "Do you consent to take part in this study?",
  choices: ["Yes, I am 18 or older, I have read the information, and I consent to participate.", "No, I do not consent."],
  correct_index: 0, data: { screen: "consent" },
  on_finish: data => { if (!data.correct) { outcome = "no_consent"; jsPsych.endExperiment(); } }
});
timeline.push({
  type: jsPsychTextEntry, title: "Prolific ID",
  prompt: isProduction ? "Your Prolific ID was provided by Prolific. Please confirm it below. Do not enter your name or email address."
    : "You can leave this blank for the preview. Do not enter your name or email address.",
  label: "Prolific ID", initial_value: prolificPid, required: isProduction,
  data: { screen: "prolific_id_entry", prolific_pid_from_url: prolificPid },
  on_finish: data => {
    effectiveProlificPid = prolificPid || data.response;
    jsPsych.data.addProperties({ prolific_pid: effectiveProlificPid, prolific_pid_confirmed: effectiveProlificPid });
  }
});
const instructions = `<p>Evaluate the marked target facade as part of its visible street context. The other three images show the right, back and left views from the same location.</p>
  <p>Consider adjacent buildings, street width, the ground-floor interface, vegetation and enclosure. Avoid basing your answer mainly on temporary elements such as cars or weather.</p>
  <p>Answer from your own immediate impression. There are no correct aesthetic answers. If you cannot judge a scene, select No in the final question; you do not need to invent a rating.</p>`;
timeline.push(makeButtonTrial({ title: "Instructions", body: instructions, data: { screen: "instructions" } }));
timeline.push({
  type: jsPsychChoiceCheck, title: "Understanding the task",
  prompt: `${instructions}<p>What should your evaluations focus on? You have two attempts.</p>`,
  choices: ["The marked target facade within its visible street context.", "Only the sky and weather.", "Only vehicles and temporary objects.", "Only the technical quality of the photograph."],
  correct_index: 0, max_attempts: 2, data: { screen: "comprehension_check" },
  on_finish: data => { if (!data.correct) { outcome = "comprehension_return"; jsPsych.endExperiment(); } }
});
const padBlock = [makeButtonTrial({
  title: "Individual facade ratings", body: `<p>Rate each of the 10 target facades on pleasure, arousal and dominance. Use the seven-point scales from -3 to +3, with 0 at the midpoint.</p><p>Here, arousal means visual stimulation. Dominance refers to perceived legibility, openness and sense of control within the street scene.</p>`,
  data: { screen: "pad_instructions" }
}), ...padSceneList.map((image, index) => ({
  type: jsPsychPadLikert, image, trial_index: index, trial_count: padSceneList.length, dimension_order: padDimensionOrder
}))];
const preferenceBlock = [makeButtonTrial({
  title: "Facade comparisons", body: "<p>For each of the five pairs, choose the target facade you prefer within its own street context. You may prefer them about equally.</p>",
  data: { screen: "pairwise_instructions" }
}), ...pairList.map((pair, index) => ({ type: jsPsychPreferencePairwise, pair, trial_index: index, trial_count: pairList.length }))];
const attention = (number, prompt, choices, correctIndex) => ({
  type: jsPsychChoiceCheck, title: "Attention check", prompt, choices, correct_index: correctIndex,
  data: { screen: `attention_check_${number}` }
});
timeline.push(...(taskOrder === "pad_first" ? padBlock : preferenceBlock));
timeline.push(attention(1, "This is an attention check. Please select Image B.", ["Image A", "Image B", "About the same"], 1));
timeline.push(...(taskOrder === "pad_first" ? preferenceBlock : padBlock));
timeline.push(attention(2, "This is an attention check. Please select No.", ["Yes", "No"], 1));
timeline.push({ ...makeButtonTrial({ title: "End of task", body: "<p>You have completed the questions.</p>",
  button: isProduction ? "Save responses" : "Finish preview", data: { screen: "pre_finish" } }),
  on_finish: () => { outcome = "complete"; }
});

const issues = launchIssues();
document.querySelector("#preview-banner").hidden = isProduction;
if (issues.length) {
  document.querySelector("#jspsych-target").innerHTML = `<div class="wrap"><section class="panel"><h1>Study unavailable</h1><p>Please contact the researcher through Prolific.</p><details><summary>Study setup details</summary><ul>${issues.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul></details></section></div>`;
} else if (isProduction && window.innerWidth < 980) {
  outcome = "technical_stop";
  showStopped();
} else {
  jsPsych.run(timeline);
}
