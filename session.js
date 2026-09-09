"use strict";

window.SurveySession = class SurveySession {
  constructor(identity, seed) {
    let storage;
    try { storage = window.localStorage; } catch {
      storage = { getItem() { throw Error("unavailable"); }, setItem() { throw Error("unavailable"); }, removeItem() { throw Error("unavailable"); } };
    }
    window.SurveyRecovery.purgeExpired(storage);
    this.store = new window.SurveyRecovery({ storage, identity, ttlMs: studyConfig.localRecoveryHours * 3600000 });
    const saved = this.store.state;
    this.seed = saved?.seed || seed;
    this.rows = saved?.rows || [];
    this.consented = saved?.consented || false;
    this.draft = saved?.draft || null;
    this.status = saved?.status || "in_progress";
    this.startedAt = saved?.startedAt || new Date().toISOString();
    this.languageHistory = saved?.languageHistory || [];
    this.resumeCount = saved ? (saved.resumeCount || 0) + 1 : 0;
    this.enabled = false;
    this.currentKey = null;
    this.startedVisit = null;
    if (saved?.language && !window.SurveyI18n.explicitLanguage) window.SurveyI18n.setLanguage(saved.language, false);
    document.addEventListener("survey-language-change", event => {
      this.languageHistory.push({ language: event.detail, at: new Date().toISOString() });
      this.capture();
    });
    for (const name of ["input", "change"]) document.addEventListener(name, event => {
      if (event.target.closest("#jspsych-target")) this.capture();
    });
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.capture(); });
    window.addEventListener("pagehide", () => this.capture());
    window.addEventListener("pageshow", event => { if (event.persisted) window.location.reload(); });
    window.addEventListener("beforeunload", event => {
      this.capture();
      if (this.consented && this.status === "in_progress" && this.store.error) {
        event.preventDefault(); event.returnValue = "";
      }
    });
    document.querySelector("#progress-clear").addEventListener("click", () => this.restart());
    document.querySelector("#progress-download").addEventListener("click", () => {
      this.capture();
      downloadText("facade-progress-backup.json", JSON.stringify({ record_type: "progress_backup", ...this.snapshot() }, null, 2), "application/json");
    });
    this.updateStatus();
  }

  snapshot() {
    return { seed: this.seed, rows: this.rows, consented: this.consented, draft: this.draft,
      status: this.status, startedAt: this.startedAt, resumeCount: this.resumeCount,
      language: window.SurveyI18n.language, languageHistory: this.languageHistory };
  }

  save() {
    if (!this.enabled || !this.consented) return;
    this.store.save(this.snapshot());
    this.updateStatus();
    if (this.store.error === "conflict") {
      this.enabled = false;
      const dialog = document.createElement("dialog");
      dialog.textContent = "This session changed in another tab. To avoid overwriting answers, close this tab and continue in the other one.";
      document.body.append(dialog);
      dialog.addEventListener("cancel", event => event.preventDefault());
      dialog.showModal();
    }
  }

  updateStatus() {
    document.querySelector("#progress-download").hidden = !this.consented;
    document.querySelector("#progress-clear").hidden = !this.consented;
    const status = document.querySelector("#recovery-status");
    status.hidden = !this.consented || (!this.store.error && this.status !== "in_progress");
    status.classList.toggle("error", Boolean(this.store.error));
    status.textContent = this.store.error === "conflict"
      ? "This session changed in another tab. To avoid overwriting answers, close this tab and continue in the other one."
      : this.store.error ? "Local backup unavailable. Keep this page open and download a progress backup before leaving."
      : "Local progress saved. Responses are not yet submitted.";
  }

  capture() {
    if (!this.enabled || !this.consented) return;
    if (this.currentKey && this.status === "in_progress") {
      const inputs = [...document.querySelectorAll("#jspsych-target input[name]")]
        .filter(input => !input.readOnly).map(input => ({ name: input.name, value: input.value, type: input.type, checked: input.checked }));
      this.draft = { key: this.currentKey, inputs,
        attempts: this.draft?.key === this.currentKey ? this.draft.attempts || [] : [],
        priorVisitMs: this.priorVisitMs || 0,
        elapsedMs: (this.priorVisitMs || 0) + (this.startedVisit === null ? 0 : Math.round(performance.now() - this.startedVisit)) };
    }
    this.save();
  }

  begin(trial) {
    this.currentKey = trial.data.study_trial_id;
    this.startedVisit = performance.now();
    this.priorVisitMs = this.draft?.key === this.currentKey ? this.draft.elapsedMs || 0 : 0;
    const key = this.currentKey;
    requestAnimationFrame(() => {
      if (this.currentKey !== key || this.draft?.key !== key) return;
      for (const input of document.querySelectorAll("#jspsych-target input[name]")) {
        if (input.readOnly) continue;
        const saved = this.draft.inputs?.find(item => item.name === input.name && item.type === input.type
          && (!["radio", "checkbox"].includes(input.type) || item.value === input.value));
        if (!saved) continue;
        if (["radio", "checkbox"].includes(input.type)) input.checked = saved.checked;
        else input.value = saved.value;
      }
      if (this.draft.attempts?.length) {
        const error = document.querySelector("#choice-error");
        if (error) { error.textContent = "Please re-read the instructions above and try once more."; error.hidden = false; }
      }
    });
  }

  draftAttempts() { return this.draft?.key === this.currentKey ? [...(this.draft.attempts || [])] : []; }
  saveAttempts(attempts) {
    this.capture();
    if (this.draft) this.draft.attempts = [...attempts];
    this.save();
  }

  finish(data) {
    if (!this.enabled) return;
    data.participant_language = window.SurveyI18n.language;
    data.response_language = window.SurveyI18n.language;
    data.session_trial_index = this.rows.length;
    data.resume_count = this.resumeCount;
    data.prior_page_duration_ms = this.priorVisitMs || 0;
    data.interrupted_question = (this.priorVisitMs || 0) > 0;
    if (data.screen === "consent") this.consented = data.correct === true;
    if (data.screen === "consent" && !this.consented) { this.discard(); return; }
    this.rows.push(JSON.parse(JSON.stringify(data)));
    this.currentKey = null;
    this.draft = null;
    if (data.screen === "comprehension_check" && !data.correct) { this.discard(); return; }
    if (data.screen === "pre_finish") this.status = "complete";
    this.save();
  }

  discard() { this.enabled = false; this.consented = false; this.rows = []; this.store.clear(); this.updateStatus(); }
  restart() {
    if (!this.enabled) return;
    if (!window.confirm(window.SurveyI18n.translate("Delete the saved progress for this session and start again?"))) return;
    if (!this.store.clear()) { this.updateStatus(); return; }
    this.enabled = false;
    window.location.reload();
  }

  remaining(timeline) {
    if (!this.rows.every((row, i) => row.study_trial_id === timeline[i]?.data.study_trial_id)) return null;
    return timeline.slice(this.rows.length);
  }

  csv() {
    const keys = [...new Set(this.rows.flatMap(row => Object.keys(row)))];
    const quote = value => '"' + (typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "")).replaceAll('"', '""') + '"';
    return [keys.map(quote).join(","), ...this.rows.map(row => keys.map(key => quote(row[key])).join(","))].join("\r\n");
  }
};
