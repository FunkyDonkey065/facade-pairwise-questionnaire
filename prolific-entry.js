"use strict";

(() => {
  const parameters = new URLSearchParams(location.search);
  const identity = new URLSearchParams();
  for (const name of ['PROLIFIC_PID','STUDY_ID','SESSION_ID']) identity.set(name, parameters.get(name) || '');
  const endpoint = '/.netlify/functions/prolific-allocation';
  const preview = location.protocol === 'file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname)
    || new URLSearchParams(location.search).get('PREVIEW') === '1';
  const words = {
    en: { title: 'Facade Perception Study', start: 'Continue', loading: 'Preparing your questionnaire...',
      intro: 'A necessary cookie remembers your questionnaire assignment for 30 days. Your Prolific ID links the assignment and its status. Responses are saved in private Netlify storage with a copy sent to Netlify Forms. Please participate only once, using the same browser and device.',
      full: 'All places are currently occupied. Please contact the researcher through Prolific and return this study. This is not an eligibility screening result.', error: 'The questionnaire could not be prepared. Please use your original browser, allow cookies, and try again. If the problem persists, contact the researcher through Prolific.',
      invalid: 'Please open this study from Prolific. The link must include your Prolific, study and session IDs.', return: 'Return to Prolific',
      expired: 'Your reservation has expired and its question group is currently full. Please try again later using this same browser.',
      done: 'This participation has ended. Thank you.', download: 'Download response backup', retry: 'Try again' },
    es: { title: 'Encuesta sobre la percepción de fachadas', start: 'Continuar', loading: 'Preparando tu cuestionario...',
      intro: 'Una cookie necesaria recuerda el cuestionario asignado durante 30 días. Tu identificador de Prolific vincula la asignación y su estado. Las respuestas se guardan en almacenamiento privado de Netlify y se envía una copia a Netlify Forms. Participa una sola vez, usando el mismo navegador y dispositivo.',
      full: 'Todas las plazas están ocupadas. Contacta con el investigador en Prolific y devuelve el estudio. Esto no es un resultado del filtro de residencia.', error: 'No se ha podido preparar el cuestionario. Utiliza el navegador original, permite las cookies e inténtalo de nuevo. Si el problema continúa, contacta con el investigador en Prolific.',
      invalid: 'Abre el estudio desde Prolific. El enlace debe incluir tus identificadores de participante, estudio y sesión.', return: 'Volver a Prolific',
      expired: 'Tu reserva ha caducado y su grupo de preguntas está completo por ahora. Inténtalo más tarde usando el mismo navegador.',
      done: 'Esta participación ha finalizado. Gracias.', download: 'Descargar copia de las respuestas', retry: 'Reintentar' },
    ca: { title: 'Enquesta sobre la percepció de façanes', start: 'Continua', loading: 'Preparant el teu qüestionari...',
      intro: 'Una galeta necessària recorda el qüestionari assignat durant 30 dies. El teu identificador de Prolific vincula l’assignació i el seu estat. Les respostes es desen en emmagatzematge privat de Netlify i se n’envia una còpia a Netlify Forms. Participa una sola vegada, amb el mateix navegador i dispositiu.',
      full: 'Totes les places estan ocupades. Contacta amb l’investigador a Prolific i retorna l’estudi. Això no és un resultat del filtre de residència.', error: 'No s’ha pogut preparar el qüestionari. Utilitza el navegador original, permet les galetes i torna-ho a provar. Si el problema continua, contacta amb l’investigador a Prolific.',
      invalid: 'Obre l’estudi des de Prolific. L’enllaç ha d’incloure els identificadors de participant, estudi i sessió.', return: 'Torna a Prolific',
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
  if (preview || window.STUDY_CONFIG.mode !== 'production') { load(); return; }
  if (!/^[a-f0-9]{24}$/i.test(identity.get('PROLIFIC_PID')) || !identity.get('STUDY_ID') || !identity.get('SESSION_ID')) {
    render('invalid'); return;
  }
  async function api(action, method = 'GET') {
    const response = await fetch(endpoint + '?' + identity + (action ? '&action=' + action : ''), {
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
      const submitted = ['complete','quality_review','late_review','screened_out'].includes(entry.status);
      render('done', submitted ? 'return' : null, () => {
        location.assign(entry.status === 'screened_out' ? window.STUDY_CONFIG.screenOutUrl : window.STUDY_CONFIG.completionUrl);
      });
      if (submitted) {
        const button = document.createElement('button'); button.className = 'secondary-button';
        button.textContent = (words[window.SurveyI18n.language] || words.es).download; button.onclick = download;
        document.querySelector('#jspsych-target .actions').append(button);
      }
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set('BLOCK_ID',entry.blockId);
    url.searchParams.delete('PAIR_SET_ID'); history.replaceState(null,'',url);
    window.ProlificAllocation = { ...entry, campaign: 'prolific-remaining95-v1-' + window.STIMULUS_MANIFEST.fingerprint,
      submissionEndpoint: endpoint + '?' + identity + '&action=submit',
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
  if (navigator.locks) navigator.locks.request('facade-prolific-bootstrap', bootstrap);
  else bootstrap();
})();
