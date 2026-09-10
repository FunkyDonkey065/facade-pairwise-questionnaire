"use strict";

const localPreview = location.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const recruitmentSource = document.body.dataset.recruitmentSource || "prolific";
const isLocalRecruitment = recruitmentSource === "local";
const configuredMode = isLocalRecruitment ? studyConfig.localMode : studyConfig.mode;
// Preview is an opt-out for technical testing, never a way to unlock production.
const studyMode = configuredMode === "upload_test" && (localPreview || getUrlParam("PREVIEW") === "1")
  ? "preview" : configuredMode;
const isProduction = studyMode === "production";
const isUploadTest = studyMode === "upload_test";
const uploadsEnabled = isProduction || isUploadTest;
const prolificPid = isLocalRecruitment ? "" : getUrlParam("PROLIFIC_PID");
const studyId = isLocalRecruitment ? "" : getUrlParam("STUDY_ID");
const sessionId = isLocalRecruitment ? "" : getUrlParam("SESSION_ID");
const localInvitationId = isLocalRecruitment ? getUrlParam("LOCAL_ID") : "";
const testFlowVersion = "dual_recruitment_rehearsal_v1";
const forcedSet = getUrlParam("BLOCK_ID") || getUrlParam("PAIR_SET_ID");
const surveySession = new window.SurveySession({ path: location.pathname, version: SURVEY_VERSION,
  manifest: window.STIMULUS_MANIFEST.fingerprint, mode: studyMode,
  ...(isUploadTest ? { testFlowVersion } : {}),
  recruitmentSource, localInvitationId, prolificPid, studyId, sessionId, forcedSet },
  localInvitationId || sessionId || prolificPid || crypto.randomUUID());
window.surveySession = surveySession;
const randomizationSeed = surveySession.seed;
const testSessionId = isUploadTest ? `TEST-${randomizationSeed.replace(/[^a-zA-Z0-9]/g, "")}` : "";
const pairSetId = forcedSet && ACTIVE_PAIR_SETS.some(b => b.set_id === forcedSet)
  ? forcedSet : pickSetFromSession(randomizationSeed);
const pairList = preparePairList(getPairSet(pairSetId), randomizationSeed);
const padDimensionOrder = pickPadDimensionOrder(randomizationSeed);
const padSceneList = preparePadSceneList(pairList, randomizationSeed);
const taskOrder = createSeededRandom(`${randomizationSeed}|task-order`)() < 0.5
  ? "pad_first" : "preference_first";
let effectiveProlificPid = prolificPid || surveySession.rows.find(r => r.screen === "prolific_id_entry")?.response || "";
const localParticipantId = isLocalRecruitment ? localInvitationId || `L-${randomizationSeed.replaceAll("-", "")}` : "";
const participantId = () => isLocalRecruitment ? localParticipantId : effectiveProlificPid;
let outcome = "in_progress";
let submissionInFlight = false;
const submissionKey = `${isUploadTest ? `TEST|${testFlowVersion}|` : ""}${SURVEY_VERSION}|${recruitmentSource}|${window.STIMULUS_MANIFEST.fingerprint}|${localParticipantId || prolificPid || randomizationSeed}|${studyId}|${sessionId}|${pairSetId}`;
let lastUploadStatus = null;

function demographicData() {
  return window.SurveyDemographics.metadata(recruitmentSource, surveySession.rows.find(r => r.screen === "demographics"));
}

function screeningData() {
  const row = surveySession.rows.find(r => r.screen === "residence_screening");
  return {
    residence_category: row?.residence_category || "",
    residence_eligible: row?.residence_eligible ?? null,
    screening_result: row ? row.residence_eligible === true ? "eligible" : "screened_out" : "not_answered"
  };
}

function launchIssues() {
  const issues = [];
  if (!["preview", "upload_test", "production"].includes(configuredMode)) issues.push("Invalid study mode.");
  if (!["prolific", "local"].includes(recruitmentSource)) issues.push("Invalid recruitment source.");
  if (isLocalRecruitment && ["PROLIFIC_PID", "STUDY_ID", "SESSION_ID"].some(getUrlParam)) issues.push("Use the Prolific entry for a Prolific invitation.");
  if (!isLocalRecruitment && getUrlParam("LOCAL_ID")) issues.push("Use local.html for a local invitation.");
  if (localInvitationId && !/^L-[a-f0-9]{32}$/.test(localInvitationId)) issues.push("The local invitation ID is invalid.");
  if (forcedSet && !ACTIVE_PAIR_SETS.some(b => b.set_id === forcedSet)) issues.push("BLOCK_ID must be B01-B25.");
  if (isUploadTest) {
    if (prolificPid && !/^[a-f\d]{24}$/i.test(prolificPid)) issues.push("The Prolific ID in the link must contain 24 characters using numbers and letters a-f.");
    if (location.protocol !== "https:" || location.hostname !== studyConfig.uploadTestHost) issues.push("Open the upload test on its configured HTTPS Netlify site.");
    if (studyConfig.collectionPlatform !== "netlify_forms" || studyConfig.submissionEndpoint !== "/") issues.push("The configured collector is not supported by this build.");
  }
  if (isProduction) {
    if (!forcedSet) issues.push("A fixed BLOCK_ID is required for quota allocation.");
    if (isLocalRecruitment) {
      if (!localInvitationId) issues.push("An individual local invitation link is required.");
    } else if (!/^[a-f\d]{24}$/i.test(prolificPid) || !studyId || !sessionId) issues.push("The Prolific study link is incomplete.");
    if (getUrlParam("PAD_TRIAL_LIMIT")) issues.push("PAD_TRIAL_LIMIT is not allowed in the fixed study design.");
    for (const name of ["geographyVerified", "independentStimuliVerified", "imageUseReviewed", "participantInformationApproved", "collectorPilotVerified"]) {
      if (studyConfig[name] !== true) issues.push(`Researcher review incomplete: ${name}.`);
    }
    if (SURVEY_SCENES.some(s => !s.geography_verified)) issues.push("Scene locations have not been verified.");
    if (!studyConfig.retentionPeriod || !studyConfig.researchContact || !studyConfig.ethicsReference) issues.push("Participant information is incomplete.");
    if (!isLocalRecruitment && (!/^https:\/\/app\.prolific\.com\/submissions\/complete\?cc=[A-Za-z0-9]+$/.test(PROLIFIC_COMPLETION_URL)
      || PROLIFIC_COMPLETION_URL.includes("YOUR"))) issues.push("Set the real Prolific completion URL.");
    if (!isLocalRecruitment && (!/^https:\/\/app\.prolific\.com\/submissions\/complete\?cc=[A-Za-z0-9]+$/.test(studyConfig.screenOutUrl || "")
      || studyConfig.screenOutUrl.includes("YOUR") || studyConfig.screenOutUrl === PROLIFIC_COMPLETION_URL)) {
      issues.push("Set a separate paid Prolific Custom screening exit URL before recruitment.");
    }
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
  if (isUploadTest) {
    for (const key of Object.keys(messages)) messages[key] = "The upload test ended. No test responses have been sent.";
  }
  if (isLocalRecruitment) {
    messages.no_consent = "You did not consent to participate. No response data has been uploaded. You may close this page.";
    messages.comprehension_return = "The study has ended. No response data has been uploaded. You may close this page or contact the research team using the contact below.";
    messages.technical_stop = "The task cannot run on this screen. No response data has been uploaded. Please contact the research team using the contact below.";
  }
  document.querySelector("#jspsych-target").innerHTML = `<div class="wrap"><section class="panel"><h1>Study ended</h1><p>${escapeHtml(messages[outcome] || "The study did not finish. No response data has been uploaded.")}</p></section></div>`;
  if (isLocalRecruitment) document.querySelector("#jspsych-target section").insertAdjacentHTML("beforeend", `<p>Research contact: ${escapeHtml(studyConfig.researchContact)}</p>`);
}

function finalizeData() {
    const rows = surveySession.rows;
    const terminal = rows.find(r => r.screen === (outcome === "screened_out" ? "residence_screening" : "pre_finish"));
    const attentionFailCount = rows.filter(r => /^attention_check_[12]$/.test(r.screen || "") && !r.correct).length;
    // Reopening a finished session must not change the uploaded response snapshot.
    if (terminal.record_type === "session_summary" && terminal.outcome === outcome) {
      return { csv: surveySession.csv(), json: JSON.stringify(rows, null, 2), attentionFailCount };
    }
    const summary = {
      record_type: "session_summary", outcome, attention_fail_count: attentionFailCount,
      ...screeningData(), ...demographicData(),
      attention_review_flag: attentionFailCount >= 2,
      completed_pad_trials: rows.filter(r => r.task === "pad_likert").length,
      usable_pad_trials: rows.filter(r => r.task === "pad_likert" && r.judgeability !== "no").length,
      completed_preference_trials: rows.filter(r => r.task === "pairwise_preference").length,
      usable_preference_trials: rows.filter(r => r.task === "pairwise_preference" && r.judgeability !== "no").length,
      completed_at: terminal.completed_at || new Date().toISOString(), session_started_at: surveySession.startedAt,
      language_history: structuredClone(surveySession.languageHistory), resumed_sessions: surveySession.resumeCount
    };
    rows.forEach(row => { row.attention_fail_count = attentionFailCount; Object.assign(row, demographicData()); });
    Object.assign(terminal, summary);
    surveySession.save();
    return { csv: surveySession.csv(), json: JSON.stringify(rows, null, 2), attentionFailCount };
}

const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  on_trial_start: trial => surveySession.begin(trial),
  on_trial_finish: data => surveySession.finish(data),
  on_finish: async () => {
    if (!["complete", "screened_out"].includes(outcome)) { showStopped(); return; }
    const { csv, json, attentionFailCount } = finalizeData();
    showFinalScreen({ status: uploadsEnabled ? "saving" : "preview", csv, json });
    if (uploadsEnabled) {
      const saved = await submitToNetlify({ csv, json, attentionFailCount });
      showFinalScreen({ status: saved ? "saved" : "failed", csv, json });
    }
  }
});

jsPsych.data.addProperties({
  participant_id: participantId(), recruitment_source: recruitmentSource,
  prolific_pid: effectiveProlificPid, study_id: studyId, session_id: sessionId,
  pair_set_id: pairSetId, allocation_method: forcedSet ? "fixed_block" : isUploadTest ? "test_hash" : "preview_hash",
  randomization_seed: randomizationSeed, task_order: taskOrder,
  pad_dimension_order: padDimensionOrder.join("|"),
  pad_scene_order: padSceneList.map(s => s.id).join("|"),
  survey_version: SURVEY_VERSION, design_version: DESIGN.version,
  protocol_source_document: studyConfig.protocolSourceDocument,
  data_processing_activity_code: studyConfig.dataProcessingActivityCode,
  ethics_reference: studyConfig.ethicsReference,
  ethics_project_title: studyConfig.ethicsProjectTitle,
  ethics_source_document: studyConfig.ethicsSourceDocument,
  ethics_committee_meeting_date: studyConfig.ethicsCommitteeMeetingDate,
  ethics_signed_date: studyConfig.ethicsSignedDate,
  manifest_fingerprint: window.STIMULUS_MANIFEST.fingerprint,
  stimulus_manifest_version: window.STIMULUS_MANIFEST.version,
  study_mode: studyMode, submission_key: submissionKey,
  test_submission: isUploadTest, test_session_id: testSessionId,
  test_flow_version: isUploadTest ? testFlowVersion : "",
  screening_method: "self_report_city_v1", ...screeningData(),
  participant_language: window.SurveyI18n.language,
  user_agent: navigator.userAgent, screen_width: window.screen.width, screen_height: window.screen.height,
  viewport_width: window.innerWidth, viewport_height: window.innerHeight
});

async function submitToNetlify({ csv, json, attentionFailCount }) {
  if (!uploadsEnabled || !surveySession.consented || !["complete", "screened_out"].includes(outcome) || submissionInFlight || launchIssues().length) return false;
  if (isLocalRecruitment ? !/^L-[a-f0-9]{32}$/.test(localParticipantId)
    : !/^[a-f\d]{24}$/i.test(effectiveProlificPid) || (prolificPid && effectiveProlificPid !== prolificPid)) return false;
  const screening = screeningData();
  if (outcome === "complete" && screening.residence_eligible !== true) return false;
  if (outcome === "screened_out" && (screening.residence_eligible !== false
    || surveySession.rows.some(r => ["pad_likert", "pairwise_preference"].includes(r.task)))) return false;
  submissionInFlight = true;
  lastUploadStatus = null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(studyConfig.submissionEndpoint, {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeFormData({
        "form-name": "facade_pairwise_data", prolific_pid: effectiveProlificPid,
        participant_id: participantId(), recruitment_source: recruitmentSource,
        study_id: studyId, session_id: sessionId, pair_set_id: pairSetId,
        randomization_seed: randomizationSeed, task_order: taskOrder,
        pad_dimension_order: padDimensionOrder.join("|"),
        pad_scene_order: padSceneList.map(s => s.id).join("|"),
        survey_version: SURVEY_VERSION, study_mode: studyMode,
        test_submission: isUploadTest, test_session_id: testSessionId,
        outcome, ...screening,
        manifest_fingerprint: window.STIMULUS_MANIFEST.fingerprint,
        attention_fail_count: attentionFailCount, submission_key: submissionKey,
        payload_json: json, payload_csv: csv
      })
    });
    lastUploadStatus = response.status;
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
  const screenedOut = outcome === "screened_out";
  const canReturn = !isLocalRecruitment && isProduction && (status === "saved" || (screenedOut && status === "failed"));
  const returnUrl = screenedOut ? studyConfig.screenOutUrl : PROLIFIC_COMPLETION_URL;
  const completionCode = canReturn ? new URL(returnUrl).searchParams.get("cc") : "";
  if (status === "saved") { surveySession.status = "submitted"; surveySession.save(); }
  const messages = {
    preview: "This preview is complete. Responses have not been uploaded. You can download them to check the study design.",
    saving: "Saving your responses. Please keep this page open.",
    saved: "Your responses have been submitted. Please return to Prolific to complete the study.",
    failed: "Your responses could not be saved. Please retry. If the problem continues, contact the researcher through Prolific and submit with NOCODE so the technical issue can be reviewed."
  };
  if (isUploadTest) {
    messages.saved = "Test responses sent. Check Netlify Forms for this test record before treating the collector as verified. This is not a Prolific submission.";
    messages.failed = "The test upload was not confirmed. Download a backup and retry. Check that Netlify Forms detection is enabled and the site has been redeployed.";
  }
  if (screenedOut) {
    messages.preview = "The screening preview is complete. No responses have been uploaded and no Prolific payment is issued in preview mode.";
    messages.saved = isUploadTest
      ? "The test screening record has been sent. No facade ratings were collected. This is a technical test, not a Prolific submission or payment."
      : "Your screening response has been submitted. You will not continue to the image ratings. Return to Prolific to register your screening completion and receive the screening payment shown there.";
    messages.failed = isUploadTest
      ? "The test upload was not confirmed. Download a backup and retry. Check that Netlify Forms detection is enabled and the site has been redeployed."
      : "Your screening response could not be saved. You can download a backup and retry, or return to Prolific now to register your screening completion. Please contact the researcher through Prolific about the upload issue.";
  }
  if (isLocalRecruitment) {
    messages.saved = isUploadTest ? "Test responses sent. Check Netlify Forms for this test record. This is not participant recruitment."
      : screenedOut ? "Your screening response has been submitted. You will not continue to the image ratings. Thank you for your interest. You may close this page."
      : "Your responses have been submitted. Thank you for taking part. You may close this page.";
    messages.failed = "Your responses could not be saved. Download a backup and retry. If the problem continues, contact the research team using the contact below and quote your participant ID.";
    messages.preview = "This preview is complete. Responses have not been uploaded. You can download them to check the study design.";
  }
  document.querySelector("#jspsych-target").innerHTML = `<div class="wrap"><section class="panel final-box">
    <h1>${status === "saving" ? "Saving responses" : screenedOut ? "Screening complete" : "Thank you"}</h1>
    <p>${messages[status]}</p>
    ${isLocalRecruitment ? `<p>Participant ID: <span data-no-translate>${escapeHtml(localParticipantId)}</span></p><p>Research contact: ${escapeHtml(studyConfig.researchContact)}</p>` : ""}
    ${canReturn ? `<p>${screenedOut ? "Screening completion code:" : "Completion code:"} <strong data-no-translate>${escapeHtml(completionCode)}</strong></p>` : ""}
    ${isUploadTest ? `<p>Test record: <span data-no-translate>${escapeHtml(testSessionId)}</span></p>` : ""}
    ${isUploadTest && lastUploadStatus !== null ? `<p>Upload service response: HTTP ${lastUploadStatus}</p>` : ""}<div class="actions">
      ${status !== "saving" ? '<button class="secondary-button" id="download-json">Download response backup</button>' : ""}
      ${status === "preview" || (isUploadTest && status !== "saving") ? '<button class="secondary-button" id="download-csv">Download CSV</button>' : ""}
      ${status === "failed" ? '<button class="primary-button" id="retry-save">Retry saving</button>' : ""}
      ${canReturn ? '<button class="primary-button" id="finish-prolific">Return to Prolific</button>' : ""}
    </div></section></div>`;
  document.querySelector("#download-json")?.addEventListener("click", () => downloadText(`facade_${pairSetId}_${testSessionId || participantId() || "preview"}.json`, json, "application/json"));
  document.querySelector("#download-csv")?.addEventListener("click", () => downloadText(`facade_${pairSetId}_${testSessionId || participantId() || "preview"}.csv`, csv, "text/csv"));
  document.querySelector("#finish-prolific")?.addEventListener("click", () => {
    window.location.href = returnUrl;
  });
  document.querySelector("#retry-save")?.addEventListener("click", async () => {
    showFinalScreen({ status: "saving", csv, json });
    const summary = JSON.parse(json).find(r => r.record_type === "session_summary");
    const saved = await submitToNetlify({ csv, json, attentionFailCount: summary.attention_fail_count });
    showFinalScreen({ status: saved ? "saved" : "failed", csv, json });
  });
}

const timeline = [];
timeline.push(makeButtonTrial({
  title: isUploadTest ? "Questionnaire upload test" : "Facade perception survey",
  body: `${isUploadTest ? `<p>${isLocalRecruitment ? "Technical test only. Use dummy responses and do not enter personal information. This is not participant recruitment." : "Technical test only. Use dummy ratings and do not enter personal information. This is not participant recruitment and there is no Prolific payment."}</p>` : ""}<p>You will view 10 target facades with their surrounding street views. You will rate each facade on three scales and compare five pairs for overall preference.</p>
    <p>${isUploadTest ? "This test includes a residence question. Use a dummy answer. A non-eligible answer ends the test before any image ratings and sends only a screening test record to Netlify." : isLocalRecruitment ? "After consent, a brief question about your current residence determines eligibility. Eligible participants continue to the image ratings; others finish after screening. Please participate only once, whether invited directly or through a recruitment platform." : "After consent and ID confirmation, a brief question about your current residence determines eligibility. Eligible participants continue to the image ratings; others finish after screening. Screening completion is paid at the amount shown on Prolific. No payment is issued in local previews."}</p>
    <p>Please use a laptop or desktop computer. Estimated time: ${escapeHtml(studyConfig.estimatedMinutes)} minutes.</p>
    <h2>Ethics review</h2>
    <p>Ethics approval or exemption reference: ${escapeHtml(studyConfig.ethicsReference || "To be confirmed before participant recruitment.")}</p>
    ${studyConfig.ethicsReference && studyConfig.ethicsProjectTitle ? `<p>Project reviewed: <span data-no-translate>${escapeHtml(studyConfig.ethicsProjectTitle)}</span></p>
    <p>Committee meeting date: ${escapeHtml(studyConfig.ethicsCommitteeMeetingDate)}<br>Signature date shown in the decision: ${escapeHtml(studyConfig.ethicsSignedDate)}</p>
    <p>The UPC Ethics Committee has issued a favourable opinion on the ethical aspects related to the research carried out in this project/article.</p>` : ""}
    ${!isProduction && !studyConfig.participantInformationApproved ? "<p>The current questionnaire and data-collection arrangements still require confirmation against the approved project scope. This preview is not open for participant recruitment.</p>" : ""}
    <h2>Data use and protection</h2>
    <p>The Universitat Politecnica de Catalunya - BarcelonaTech (UPC) is the data controller named in the research protocol for this academic study on visual perception of building facades. Processing is subject to the General Data Protection Regulation (EU) 2016/679 and Organic Law 3/2018.</p>
    <p>Responsible department: ${escapeHtml(studyConfig.responsibleDepartment)}<br>Data-processing activity: ${escapeHtml(studyConfig.dataProcessingActivityCode)}</p>
    <p>${isUploadTest ? "You may stop this technical test at any time. Contact the research team using the email below about a submitted test record." : isLocalRecruitment ? "Taking part is voluntary. You may stop at any time by closing the survey. To request withdrawal of a response before it is de-identified, contact the research team using the email below and quote your participant ID." : "Taking part is voluntary. You may stop at any time by closing the survey. Contact the research team through Prolific if you wish to request withdrawal of an identifiable response before it is de-identified."}</p>
    <p>${isLocalRecruitment ? "The questionnaire records a coded participant ID and recruitment source; PAD ratings, pairwise choices and image-judgeability responses; comprehension and attention-check answers; response times; display language and recovery events; and browser, screen and viewport information. We do not ask for your name or email address." : isUploadTest ? "This rehearsal follows the Prolific ID step used in the study. Use a dummy 24-character ID, for example 000000000000000000000001. The entered or URL-provided ID, study and session parameters, dummy ratings, choices, checks, response times, language and recovery events, and browser and display information are included in the test record. No Prolific account is verified, no payment is made, and test records are excluded from the study analysis." : "The study records your Prolific participant, study and session identifiers; PAD ratings, pairwise choices and image-judgeability responses; comprehension and attention-check answers; response times; display language and recovery events; and browser, screen and viewport information. Selected demographic information will be supplied by Prolific. Your participant ID links these records and supports participation checks and payment."}</p>
    <p>${isLocalRecruitment ? "After the image ratings, optional questions ask about your age group, gender identity, highest completed education, design background and time living in Barcelona city. You may leave these questions unanswered. Your answers will not determine eligibility." : "After the image ratings, optional questions ask about your gender identity, design background and time living in Barcelona city. Age and education will be linked from the study's Prolific demographic export using your participant ID, where available. Gender identity is recorded separately from Prolific's Sex field. Optional answers do not determine eligibility."}</p>
    <p>We also record your residence category and screening outcome. We do not ask for your address, postcode or location coordinates. Screening-only records are kept separate from facade-rating analyses.</p>
    <p>Processing is based on your consent. You may withdraw consent by contacting the research team. You may request access, rectification, erasure, restriction of processing or data portability, and object to processing where applicable.</p>
    <p>The protocol specifies password-protected research storage managed by the department, with access limited to the research team and periodic backups. The collection service used by this questionnaire is described below.</p>
    <p>${isLocalRecruitment ? "The protocol separates coded research responses from identifying information for analysis. It provides for academic publications and open release of fully anonymized ratings and generalized profile data in CORA. Invitation IDs and linkage information will not be included in public datasets." : "The protocol separates coded research responses from identifying information for analysis. It provides for academic publications and open release of fully anonymized ratings and generalized profile data in CORA. Prolific IDs and linkage information will not be included in public datasets."}</p>
    <p>After you consent, a temporary copy of your progress and current selections is saved in this browser. Recovery expires 24 hours after your last activity; expired copies are removed when this survey is next opened. Reopening the same link in this browser before expiry can restore your progress. Clearing browser data or changing devices prevents recovery. You can delete the local copy using the button above.</p>
    <p>${isUploadTest ? "After you consent, progress is saved in this browser. A test record is sent to Netlify Forms when screening ends the session, or when you click Send test responses after the image ratings. Earlier preview answers are not automatically uploaded. The researcher must verify and then remove technical test records from Netlify." : isProduction ? "Responses are submitted using Netlify Forms and exported to restricted research storage." : "This is a preview. Responses are not uploaded. After consent, they are temporarily stored in this browser so you can resume, and you may download a backup."}</p>
    <p>${isUploadTest ? "Technical test records must be removed from Netlify after verification." : `Retention period: ${escapeHtml(studyConfig.retentionPeriod || "To be confirmed before participant recruitment.")}`}<br><a href="https://www.upc.edu/normatives/ca/proteccio-de-dades/politica-de-conservacio-de-les-dades-de-caracter-personal">UPC data retention policy</a></p>
    <p>Research contact: ${escapeHtml(studyConfig.researchContact || "To be confirmed before participant recruitment.")}</p>
    <p>Data protection enquiries: <a href="mailto:proteccio.dades@upc.edu">proteccio.dades@upc.edu</a>. You may exercise applicable data protection rights and contact the <a href="https://apdcat.gencat.cat">Catalan Data Protection Authority</a>.</p>
    <p><a href="https://www.upc.edu/normatives/ca/proteccio-de-dades/drets">UPC data protection rights and request procedure</a></p>`,
  data: { screen: "welcome" }
}));
timeline.push({
  type: jsPsychChoiceCheck, title: "Consent", prompt: isUploadTest ? "Do you agree to send these technical test responses to Netlify?" : "Do you consent to take part in this study?",
  choices: [isUploadTest ? "Yes, I am 18 or older and agree to submit test responses." : "Yes, I am 18 or older, I have read the information, and I consent to participate.", "No, I do not consent."],
  correct_index: 0, data: { screen: "consent" },
  on_finish: data => { if (!data.correct) { outcome = "no_consent"; jsPsych.endExperiment(); } }
});
if (!isLocalRecruitment) timeline.push({
  type: jsPsychTextEntry, title: "Prolific ID",
  prompt: uploadsEnabled && prolificPid ? "Your Prolific ID was supplied in the study link. Please confirm it below. Do not enter your name or email address."
    : uploadsEnabled ? "Please enter your Prolific ID. Do not enter your name or email address."
    : "You can leave this blank for the preview. Do not enter your name or email address.",
  label: "Prolific ID", initial_value: prolificPid, required: uploadsEnabled,
  read_only: uploadsEnabled && Boolean(prolificPid), validate_prolific_id: uploadsEnabled,
  data: { screen: "prolific_id_entry", prolific_pid_from_url: prolificPid },
  on_finish: data => {
    effectiveProlificPid = prolificPid || data.response;
    jsPsych.data.addProperties({ participant_id: participantId(), prolific_pid: effectiveProlificPid, prolific_pid_confirmed: effectiveProlificPid });
    surveySession.rows.forEach(row => {
      row.participant_id = participantId();
      row.prolific_pid = effectiveProlificPid;
      row.prolific_pid_confirmed = effectiveProlificPid;
    });
  }
});
const residenceCategories = ["barcelona_city", "other_barcelona_province", "elsewhere_spain", "outside_spain", "prefer_not_to_answer"];
timeline.push({
  type: jsPsychChoiceCheck, title: "Current residence",
  prompt: "Where do you currently live? Please indicate your usual place of residence, not a place you are visiting.",
  choices: ["Barcelona city (within the municipality of Barcelona)", "Another municipality in Barcelona province", "Elsewhere in Spain", "Outside Spain", "Prefer not to answer"],
  score_response: false, max_attempts: 1,
  data: { screen: "residence_screening" },
  on_finish: data => {
    const eligible = data.choice_index === 0;
    const screening = { residence_category: residenceCategories[data.choice_index], residence_eligible: eligible,
      screening_result: eligible ? "eligible" : "screened_out" };
    Object.assign(data, screening);
    jsPsych.data.addProperties(screening);
    surveySession.rows.forEach(row => Object.assign(row, screening));
    if (!eligible) { outcome = "screened_out"; jsPsych.endExperiment(); }
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
timeline.push({
  type: window.SurveyDemographics.plugin, source: recruitmentSource, data: { screen: "demographics" },
  on_finish: data => {
    const demographics = window.SurveyDemographics.metadata(recruitmentSource, data);
    Object.assign(data, demographics);
    jsPsych.data.addProperties(demographics);
    surveySession.rows.forEach(row => Object.assign(row, demographics));
  }
});
timeline.push({ ...makeButtonTrial({ title: "End of task", body: "<p>You have completed the questions.</p>",
  button: isUploadTest ? "Send test responses" : isProduction ? "Save responses" : "Finish preview", data: { screen: "pre_finish" } }),
  on_finish: () => { outcome = "complete"; }
});

timeline.forEach((trial, index) => {
  trial.data = { ...trial.data, study_trial_id: `T${String(index).padStart(2, "0")}` };
});

function startOrResume() {
  surveySession.enabled = true;
  if (uploadsEnabled && window.innerWidth < 980) {
    document.querySelector("#jspsych-target").innerHTML = `<div class="wrap"><section class="panel"><h1>Enlarge the window</h1><p>Please maximize this browser window or use a laptop or desktop computer, then try again. Your saved progress has not been deleted.</p><button class="primary-button" id="retry-window">Try again</button></section></div>`;
    document.querySelector("#retry-window").onclick = startOrResume;
    return;
  }
  const remaining = surveySession.remaining(timeline);
  if (!remaining) {
    surveySession.enabled = false;
    document.querySelector("#jspsych-target").textContent = "Saved progress does not match this questionnaire. Download your backup and contact the researcher; it has not been overwritten.";
    return;
  }
  if (surveySession.rows.length) {
    document.querySelector("#jspsych-target").innerHTML = `<div class="wrap"><section class="panel"><h1>Saved progress found</h1><p>Continue the saved session in this browser. Your previous answers and question order will be preserved.</p><div class="actions"><button class="secondary-button" id="resume-restart">Start again</button><button class="primary-button" id="resume-session">Resume session</button></div></section></div>`;
    document.querySelector("#resume-restart").onclick = () => surveySession.restart();
    document.querySelector("#resume-session").onclick = () => {
      // An early screen-out has remaining timeline entries, but must never resume into ratings.
      if (screeningData().residence_eligible === false || !remaining.length) {
        outcome = screeningData().residence_eligible === false ? "screened_out" : "complete";
        showFinalScreen({ status: !uploadsEnabled ? "preview" : surveySession.status === "submitted" ? "saved" : "failed",
          ...finalizeData() });
      } else jsPsych.run(remaining);
    };
  } else jsPsych.run(timeline);
}

function startWithLock() {
  if (!navigator.locks) { startOrResume(); return; }
  navigator.locks.request(surveySession.store.key, { ifAvailable: true }, async lock => {
    if (!lock) {
      document.querySelector("#jspsych-target").innerHTML = `<div class="wrap"><section class="panel"><h1>Use one tab</h1><p>This survey is already open in another tab. Close that tab, then try again here.</p><button id="retry-tab" class="primary-button">Try again</button></section></div>`;
      document.querySelector("#retry-tab").onclick = () => location.reload();
      return;
    }
    startOrResume();
    await new Promise(resolve => window.addEventListener("pagehide", resolve, { once: true }));
  }).catch(() => startOrResume());
}

const issues = launchIssues();
if (issues.length) {
  document.querySelector("#jspsych-target").innerHTML = `<div class="wrap"><section class="panel"><h1>Study unavailable</h1><p>${isLocalRecruitment ? `Research contact: ${escapeHtml(studyConfig.researchContact)}` : "Please contact the researcher through Prolific."}</p><details><summary>Study setup details</summary><ul>${issues.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul></details></section></div>`;
} else {
  startWithLock();
}
