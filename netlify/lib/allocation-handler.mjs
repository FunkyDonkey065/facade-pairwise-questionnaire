import { createHash, randomBytes } from 'node:crypto';
import { AllocationError, transact, claim, publicEntry, validateRows, finish } from './allocation-core.mjs';

const COOKIE = '__Host-facade-local';
const hash = value => createHash('sha256').update(value).digest('hex');
const fieldsAllowed = new Set(['form-name','prolific_pid','participant_id','recruitment_source','study_id','session_id','pair_set_id','randomization_seed','task_order','pad_dimension_order','pad_scene_order','survey_version','study_mode','test_submission','test_session_id','outcome','residence_category','residence_eligible','screening_result','manifest_fingerprint','attention_fail_count','submission_key','payload_json','payload_csv']);

export function createHandler({ store, responses, design, clock = Date.now, mirror = fetch }) {
  const stateKey = design.campaign + '/quotas';
  const prolific = design.recruitmentSource === 'prolific';
  const cookieName = prolific ? '__Host-facade-prolific' : COOKIE;
  return async request => {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' };
    const respond = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
    try {
      if (!design.enabled) throw new AllocationError('recruitment_paused', 503);
      const url = new URL(request.url);
      if (url.hostname !== design.host || url.protocol !== 'https:') throw new AllocationError('wrong_host', 403);
      if (!['GET', 'POST'].includes(request.method)) throw new AllocationError('method_not_allowed', 405);
      if (request.method === 'POST' && request.headers.get('origin') !== url.origin) throw new AllocationError('origin_required', 403);
      const pid = url.searchParams.get('PROLIFIC_PID') || '';
      const study = url.searchParams.get('STUDY_ID') || '';
      const session = url.searchParams.get('SESSION_ID') || '';
      if (prolific && (!/^[a-f0-9]{24}$/i.test(pid) || !/^[a-zA-Z0-9_-]{1,128}$/.test(study)
        || !/^[a-zA-Z0-9_-]{1,128}$/.test(session))) throw new AllocationError('invalid_prolific_link', 400);
      let token = (request.headers.get('cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
      if (!/^[a-f0-9]{64}$/.test(token || '')) {
        if (request.method !== 'GET' || url.searchParams.has('action')) throw new AllocationError('cookies_required', 403);
        token = randomBytes(32).toString('hex');
        headers['Set-Cookie'] = `${cookieName}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`;
        return respond({ status: 'new' });
      }
      const key = hash(prolific ? pid.toLowerCase() : token);
      const checkIdentity = entry => {
        if (prolific && entry && (entry.tokenHash !== hash(token) || entry.studyId !== study || entry.sessionId !== session)) {
          throw new AllocationError('participation_exists_use_original_browser', 403);
        }
      };
      const now = clock();
      if (request.method === 'GET') {
        const state = await store.get(stateKey, { type: 'json', consistency: 'strong' });
        checkIdentity(state?.entries[key]);
        if (url.searchParams.get('action') === 'response') {
          const entry = state?.entries[key];
          if (!entry?.responseHash) throw new AllocationError('response_missing', 404);
          const record = await responses.get(`${design.campaign}/responses/${entry.participantId}`, { type: 'json', consistency: 'strong' });
          if (!record) throw new AllocationError('response_missing', 404);
          return respond({ participantId: entry.participantId, rows: record.rows });
        }
        return respond(state?.entries[key] ? publicEntry(state.entries[key], now) : { status: 'new' });
      }
      const raw = await request.text();
      if (Buffer.byteLength(raw) > 1500000) throw new AllocationError('payload_too_large', 413);
      const action = url.searchParams.get('action');
      if (action === 'claim' || action === 'renew') {
        if (raw.length > 100) throw new AllocationError('invalid_request', 400);
        if (action === 'renew') {
          const current = await store.get(stateKey, { type: 'json', consistency: 'strong' });
          if (!current?.entries[key]) throw new AllocationError('invitation_missing', 403);
        }
        const entry = await transact(store, stateKey, state => {
          checkIdentity(state.entries[key]);
          claim(state, key, design, now);
          if (prolific && !state.entries[key].tokenHash) {
            Object.assign(state.entries[key], { participantId: pid, tokenHash: hash(token), studyId: study, sessionId: session });
          }
          return publicEntry(state.entries[key], now);
        });
        return respond(entry);
      }
      if (action === 'abandon') {
        return respond(await transact(store, stateKey, state => {
          const entry = state.entries[key];
          checkIdentity(entry);
          if (!entry) throw new AllocationError('invitation_missing', 403);
          if (entry.status === 'reserved' && !entry.responseHash) entry.status = 'withdrawn';
          return publicEntry(entry, now);
        }));
      }
      if (action !== 'submit') throw new AllocationError('invalid_action', 400);
      const fields = Object.fromEntries(new URLSearchParams(raw));
      if (Object.keys(fields).some(k => !fieldsAllowed.has(k))) throw new AllocationError('invalid_fields', 400);
      let rows;
      try { rows = JSON.parse(fields.payload_json); } catch { throw new AllocationError('invalid_response', 400); }
      const state = await store.get(stateKey, { type: 'json', consistency: 'strong' });
      const entry = state?.entries[key];
      if (!entry) throw new AllocationError('invitation_missing', 403);
      checkIdentity(entry);
      let validationRows = rows;
      if (prolific) {
        if (!Array.isArray(rows) || ![4,27].includes(rows.length) || rows.some(r => !r || r.prolific_pid !== pid
          || r.recruitment_source !== 'prolific' || r.study_id !== study || r.session_id !== session
          || r.recruitment_batch !== 'main' || r.allocation_campaign !== design.campaign)) throw new AllocationError('invalid_response',400);
        const ids = rows.filter(r => r.screen === 'prolific_id_entry');
        if (ids.length !== 1 || ids[0].response !== pid) throw new AllocationError('invalid_response',400);
        validationRows = rows.filter(r => r.screen !== 'prolific_id_entry').map(r => ({...r,recruitment_source:'local',prolific_pid:''}));
      }
      const qualityResult = validateRows(validationRows, entry, design);
      // Quotas count completed participants, not a post-hoc quality decision.
      const result = prolific && qualityResult === 'quality_review' ? 'complete' : qualityResult;
      if (fields.participant_id !== entry.participantId || fields.pair_set_id !== entry.blockId
        || fields.recruitment_source !== (prolific ? 'prolific' : 'local') || fields.test_submission !== 'false'
        || (prolific && (fields.prolific_pid !== pid || fields.study_id !== study || fields.session_id !== session))
        || fields.study_mode !== 'production' || fields['form-name'] !== 'facade_pairwise_data'
        || fields.outcome !== rows.at(-1).outcome) throw new AllocationError('invalid_fields', 400);
      const responseHash = hash(JSON.stringify(rows));
      const responseKey = `${design.campaign}/responses/${entry.participantId}`;
      const record = { participantId: entry.participantId, blockId: entry.blockId,
        receivedAt: new Date(now).toISOString(), responseHash, preliminaryResult: qualityResult, rows };
      // The durable response is saved before the quota is consumed. Retries use the same key.
      const saved = await responses.setJSON(responseKey, record, { onlyIfNew: true });
      if (!saved.modified) {
        const existing = await responses.get(responseKey, { type: 'json', consistency: 'strong' });
        if (!existing || existing.responseHash !== responseHash) throw new AllocationError('already_submitted');
      } else if (!saved.etag) throw new AllocationError('storage_unconfirmed', 503);
      const finished = await transact(store, stateKey, state => finish(state, key, { hash: responseHash, result }, clock()));
      let mirrored = false;
      if (saved.modified) {
        try {
          const response = await mirror(`https://${design.host}/`, {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(fields).toString(), signal: AbortSignal.timeout(6000)
          });
          mirrored = response.ok;
        } catch { /* The private response is authoritative even if the Forms copy fails. */ }
      }
      return respond({ ...finished, saved: true, formsCopyAttempted: saved.modified, formsCopyHttpAccepted: mirrored });
    } catch (error) {
      if (error instanceof AllocationError) return respond({ error: error.code }, error.status);
      console.error('Allocation request failed', error?.name || 'Error');
      return respond({ error: 'storage_unavailable' }, 503);
    }
  };
}
