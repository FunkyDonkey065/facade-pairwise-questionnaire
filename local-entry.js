"use strict";

(() => {
  const endpoint = '/.netlify/functions/local-allocation';
  const preview = location.protocol === 'file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname)
    || new URLSearchParams(location.search).get('PREVIEW') === '1';
  const words = {
    en: { title: 'Facade Perception Study', start: 'Continue', loading: 'Preparing your questionnaire...',
      intro: 'A necessary cookie remembers your questionnaire assignment for 30 days. The server stores a coded assignment and its status. Please participate only once, using the same browser and device.',
      full: 'All places are currently occupied. Please try again later.', error: 'The questionnaire could not be prepared. Please check your connection and allow cookies, then try again.',
      expired: 'Your reservation has expired and its question group is currently full. Please try again later using this same browser.',
      done: 'This participation has ended. Thank you.', download: 'Download response backup', retry: 'Try again' },
    es: { title: 'Encuesta sobre la percepción de fachadas', start: 'Continuar', loading: 'Preparando tu cuestionario...',
      intro: 'Una cookie necesaria recuerda el cuestionario asignado durante 30 días. El servidor guarda una asignación codificada y su estado. Participa una sola vez, usando el mismo navegador y dispositivo.',
      full: 'Todas las plazas están ocupadas actualmente. Inténtalo de nuevo más tarde.', error: 'No se ha podido preparar el cuestionario. Comprueba tu conexión y permite las cookies antes de volver a intentarlo.',
      expired: 'Tu reserva ha caducado y su grupo de preguntas está completo por ahora. Inténtalo más tarde usando el mismo navegador.',
      done: 'Esta participación ha finalizado. Gracias.', download: 'Descargar copia de las respuestas', retry: 'Reintentar' },
    ca: { title: 'Enquesta sobre la percepció de façanes', start: 'Continua', loading: 'Preparant el teu qüestionari...',
      intro: 'Una galeta necessària recorda el qüestionari assignat durant 30 dies. El servidor desa una assignació codificada i el seu estat. Participa una sola vegada, amb el mateix navegador i dispositiu.',
      full: 'Totes les places estan ocupades actualment. Torna-ho a provar més tard.', error: "No s'ha pogut preparar el qüestionari. Comprova la connexió i permet les galetes abans de tornar-ho a provar.",
      expired: 'La teva reserva ha caducat i el seu grup de preguntes està complet ara mateix. Torna-ho a provar més tard amb el mateix navegador.',
      done: 'Aquesta participació ha finalitzat. Gràcies.', download: 'Descarrega una còpia de les respostes', retry: 'Torna-ho a provar' }
  };
  let started = false, busy = false, currentView = ['loading'];
  function load() {
    if (started) return;
    started = true;
    const script = document.createElement('script'); script.src = 'run_survey.js';
    script.onerror = () => { started = false; render('error','retry',bootstrap); };
    document.body.append(script);
  }
  if (preview || !window.STUDY_CONFIG.localAutomaticAllocation || window.STUDY_CONFIG.localMode !== 'production') { load(); return; }
  async function api(action, method = 'GET') {
    const response = await fetch(endpoint + (action ? '?action=' + action : ''), {
      method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000),
      ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: '{}' } : {})
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'unavailable');
    return result;
  }
  function render(message, button, action) {
    currentView = [message,button,action];
    const text = words[window.SurveyI18n.language] || words.es;
    const target = document.getElementById('jspsych-target'); target.replaceChildren();
    const wrap = document.createElement('div'); wrap.className = 'wrap';
    const section = document.createElement('section'); section.className = 'panel';
    const h1 = document.createElement('h1'); h1.textContent = text.title;
    const p = document.createElement('p'); p.textContent = text[message]; p.setAttribute('role','status');
    section.append(h1,p);
    if (button) {
      const actions = document.createElement('div'); actions.className = 'actions';
      const b = document.createElement('button'); b.className = 'primary-button'; b.textContent = text[button]; b.onclick = action;
      actions.append(b); section.append(actions);
    }
    wrap.append(section); target.append(wrap);
  }
  document.addEventListener('survey-language-change', () => { if (!started) render(...currentView); });
  async function download() {
    try {
      const record = await api('response');
      const blob = new Blob([JSON.stringify(record.rows,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'facade_' + record.participantId + '.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { render('error','retry',download); }
  }
  function accept(entry) {
    if (entry.status === 'new') { render('intro','start',allocate); return; }
    if (entry.status === 'expired') { render('expired','retry',allocate); return; }
    if (entry.status !== 'reserved') {
      render('done', ['complete','quality_review','late_review','screened_out'].includes(entry.status) ? 'download' : null, download); return;
    }
    const url = new URL(location.href);
    url.searchParams.set('LOCAL_ID',entry.participantId); url.searchParams.set('BLOCK_ID',entry.blockId);
    url.searchParams.delete('PAIR_SET_ID'); history.replaceState(null,'',url);
    window.LocalAllocation = { ...entry, campaign: 'local-auto-v1-' + window.STIMULUS_MANIFEST.fingerprint,
      abandon: () => api('abandon','POST').catch(() => {}) };
    let lastActivity = Date.now();
    for (const event of ['click','input','change','keydown']) document.addEventListener(event, () => { lastActivity = Date.now(); });
    const heartbeat = setInterval(() => {
      if (window.surveySession?.status === 'submitted') { clearInterval(heartbeat); return; }
      if (!document.hidden && Date.now() - lastActivity < 10 * 60 * 1000) api('renew','POST').catch(() => {});
    }, 5 * 60 * 1000);
    load();
  }
  async function allocate() {
    if (busy) return; busy = true; render('loading');
    try { accept(await api('claim','POST')); }
    catch (e) { render(e.message === 'full' ? 'full' : 'error','retry',bootstrap); }
    finally { busy = false; }
  }
  async function bootstrap() {
    render('loading');
    try {
      const entry = await api('');
      accept(entry.status === 'reserved' ? await api('renew','POST') : entry);
    }
    catch { render('error','retry',bootstrap); }
  }
  // Serialise initial cookie assignment across tabs in browsers supporting Web Locks.
  if (navigator.locks) navigator.locks.request('facade-local-bootstrap', bootstrap);
  else bootstrap();
})();
