import { randomInt, randomUUID } from 'node:crypto';

export class AllocationError extends Error {
  constructor(code, status = 409) { super(code); this.code = code; this.status = status; }
}

export async function transact(store, key, change, attempts = 25) {
  for (let i = 0; i < attempts; i++) {
    const snapshot = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    const state = snapshot?.data || { version: 1, entries: {} };
    if (state.version !== 1 || !state.entries) throw new AllocationError('state_invalid', 503);
    const result = change(state);
    const written = await store.setJSON(key, state, snapshot ? { onlyIfMatch: snapshot.etag } : { onlyIfNew: true });
    if (written.modified && written.etag) return result;
    await new Promise(resolve => setTimeout(resolve, 5 + randomInt(25)));
  }
  throw new AllocationError('busy', 503);
}

export function counts(state, design, now) {
  return design.blocks.map(block => {
    const entries = Object.values(state.entries).filter(e => e.blockId === block.id);
    const complete = entries.filter(e => e.status === 'complete').length;
    const reserved = entries.filter(e => e.status === 'reserved' && e.expiresAt > now).length;
    return { blockId: block.id, complete, reserved, occupied: complete + reserved };
  });
}

export function publicEntry(entry, now) {
  return { participantId: entry.participantId, blockId: entry.blockId, expiresAt: entry.expiresAt,
    status: entry.status === 'reserved' && entry.expiresAt <= now ? 'expired' : entry.status };
}

export function claim(state, key, design, now) {
  const existing = state.entries[key];
  if (existing) {
    if (existing.status !== 'reserved') return publicEntry(existing, now);
    if (now >= existing.startedAt + design.maximumLeaseMs) return publicEntry(existing, now);
    if (existing.expiresAt <= now) {
      const current = counts(state, design, now).find(c => c.blockId === existing.blockId);
      if (design.excludedBlocks?.includes(existing.blockId) || current.occupied >= (design.blockTargets?.[existing.blockId] ?? design.targetPerBlock)) return publicEntry(existing, now);
    }
    existing.expiresAt = Math.min(now + design.leaseMs, existing.startedAt + design.maximumLeaseMs);
    return publicEntry(existing, now);
  }
  if (Object.keys(state.entries).length >= 5000) throw new AllocationError('recruitment_paused', 503);
  const available = counts(state, design, now).filter(c => !design.excludedBlocks?.includes(c.blockId) && c.occupied < (design.blockTargets?.[c.blockId] ?? design.targetPerBlock));
  if (!available.length) throw new AllocationError('full');
  const minimum = Math.min(...available.map(c => c.occupied));
  const pool = available.filter(c => c.occupied === minimum);
  const blockId = pool[randomInt(pool.length)].blockId;
  const entry = { participantId: 'L-' + randomUUID().replaceAll('-', ''), blockId,
    status: 'reserved', startedAt: now, expiresAt: now + design.leaseMs };
  state.entries[key] = entry;
  return publicEntry(entry, now);
}

export function validateRows(rows, entry, design) {
  const fail = () => { throw new AllocationError('invalid_response', 400); };
  if (!Array.isArray(rows) || ![3, 26].includes(rows.length)) fail();
  if (rows.some(r => !r || r.participant_id !== entry.participantId || r.pair_set_id !== entry.blockId
    || r.recruitment_source !== 'local' || r.prolific_pid !== '' || r.study_mode !== 'production'
    || r.test_submission !== false || r.manifest_fingerprint !== design.fingerprint || r.survey_version !== design.surveyVersion)) fail();
  if (new Set(rows.map(r => r.study_trial_id)).size !== rows.length) fail();
  const single = name => {
    const found = rows.filter(r => r.screen === name);
    if (found.length !== 1) fail();
    return found[0];
  };
  if (single('consent').choice_index !== 0) fail();
  const screening = single('residence_screening');
  const summary = rows.at(-1);
  if (summary.record_type !== 'session_summary') fail();
  if (summary.outcome === 'screened_out') {
    if (rows.length !== 3 || screening.residence_eligible !== false || screening.residence_category === 'barcelona_city'
      || rows.some(r => r.task)) fail();
    return 'screened_out';
  }
  if (summary.outcome !== 'complete' || rows.length !== 26 || screening.residence_eligible !== true || screening.residence_category !== 'barcelona_city') fail();
  if (single('comprehension_check').correct !== true) fail();
  const check1 = single('attention_check_1'), check2 = single('attention_check_2');
  single('demographics');
  const block = design.blocks.find(b => b.id === entry.blockId);
  const pads = rows.filter(r => r.task === 'pad_likert');
  const pairs = rows.filter(r => r.task === 'pairwise_preference');
  if (pads.length !== 10 || pairs.length !== 5 || new Set(pads.map(r => r.image_id)).size !== 10
    || new Set(pairs.map(r => r.pair_id)).size !== 5 || pads.some(r => !block.padIds.includes(r.image_id))) fail();
  let usable = true;
  for (const row of pads) {
    for (const dimension of ['pleasure', 'arousal', 'dominance']) {
      const value = row[dimension + '_likert'], normalized = row[dimension + '_norm'];
      const valid = Number.isInteger(value) && value >= -3 && value <= 3
        && typeof normalized === 'number' && Math.abs(normalized - value / 3) < 1e-9;
      if (!valid && row.judgeability !== 'no') fail();
      if (!valid) usable = false;
    }
  }
  for (const row of pairs) {
    const pair = block.pairs.find(p => p[0] === row.pair_id);
    if (!pair || row.image_A_id === row.image_B_id || !pair.slice(1).includes(row.image_A_id) || !pair.slice(1).includes(row.image_B_id)) fail();
    if (![-2, -1, 0, 1, 2].includes(row.preference_choice) && row.judgeability !== 'no') fail();
  }
  if ([...pads, ...pairs].some(r => !['yes','somewhat'].includes(r.judgeability) || r.image_load_status !== 'ready')) usable = false;
  if (check1.correct !== true && check2.correct !== true) usable = false;
  return usable ? 'complete' : 'quality_review';
}

export function finish(state, key, receipt, now) {
  const entry = state.entries[key];
  if (!entry) throw new AllocationError('invitation_missing', 403);
  if (entry.responseHash) {
    if (entry.responseHash !== receipt.hash) throw new AllocationError('already_submitted');
    return publicEntry(entry, now);
  }
  const late = entry.status !== 'reserved' || entry.expiresAt <= now;
  entry.status = receipt.result === 'complete' && late ? 'late_review' : receipt.result;
  entry.responseHash = receipt.hash;
  entry.savedAt = now;
  return publicEntry(entry, now);
}
