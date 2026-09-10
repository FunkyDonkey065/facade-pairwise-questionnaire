import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { coverageReport } from './coverage-report.mjs';
import { claim } from '../netlify/lib/allocation-core.mjs';

const configContext = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('../study_config.js', import.meta.url), 'utf8'), configContext);
const config = configContext.window.STUDY_CONFIG;
assert.equal(config.prolificInitialTarget, 4);
assert.equal(config.localMode, 'production');
assert.equal(config.localAutomaticAllocation, true);
const code = fs.readFileSync(new URL('../run_survey.js', import.meta.url), 'utf8').split('function showStopped()')[0];
function check(source, overrides = {}, batch = 'initial_4', block = '') {
  const params = { PROLIFIC_PID: 'a'.repeat(24), STUDY_ID: 'pilot-study', SESSION_ID: 'pilot-session', BLOCK_ID: block };
  const context = {
    location: { protocol: 'https:', hostname: 'facadeevaluation.netlify.app', pathname: '/index.html' },
    document: { body: { dataset: { recruitmentSource: source, recruitmentBatch: batch } } },
    studyConfig: { ...config, ...overrides },
    getUrlParam: key => source === 'local' ? '' : params[key] || '',
    window: { STIMULUS_MANIFEST: { fingerprint: 'test' }, SurveySession: class {
      constructor() { this.seed = 'test'; this.rows = []; }
    } },
    SURVEY_VERSION: 'test', ACTIVE_PAIR_SETS: [{ set_id: 'B01' }, { set_id: 'B02' }], SURVEY_SCENES: [{ geography_verified: true }],
    PROLIFIC_COMPLETION_URL: config.completionUrl,
    crypto: { randomUUID: () => 'test' }, pickSetFromSession: () => 'B01',
    getPairSet: () => [], preparePairList: () => [], pickPadDimensionOrder: () => [],
    preparePadSceneList: () => [], createSeededRandom: () => () => 0.5,
  };
  return vm.runInNewContext(code + '\n({initial:isInitialBatch, batch:recruitmentBatch, block:forcedSet, issues:launchIssues()})', context);
}
assert.equal(check('prolific').issues.length, 0);
const pending = check('prolific', { imageUseReviewed: false });
assert.equal(pending.initial, true);
assert.equal(pending.batch, 'initial_4');
assert.equal(pending.block, 'B01');
assert(!pending.issues.some(x => x.includes('Confirm the Prolific study')));
assert(pending.issues.some(x => x.includes('imageUseReviewed')));
const approvedFixture = { prolificStudyConfirmed: true, independentStimuliVerified: true,
  imageUseReviewed: true, participantInformationApproved: true };
assert.equal(check('prolific', approvedFixture).issues.length, 0);
assert(check('prolific', approvedFixture, 'main', 'B02').issues.some(x => x.includes('server-assigned Prolific')));
assert(check('prolific', approvedFixture, 'main', 'B01').issues.some(x => x.includes('reserved')));
assert(check('prolific', approvedFixture, 'initial_4', 'B02').issues.some(x => x.includes('initial four')));
assert.equal(check('local').initial, false);
const report = coverageReport([{ name: 'initial', rows: [{ study_phase: 'main', recruitment_batch: 'initial_4' }] }]);
assert.equal(report.accepted_unique_participants, 0);
assert.equal(report.exclusions[0].reason, 'incomplete');
const allocationDesign = { blocks: [{ id: 'B01' }, { id: 'B02' }], excludedBlocks: ['B01'], targetPerBlock: 4,
  leaseMs: 1000, maximumLeaseMs: 5000 };
const state = { version: 1, entries: {} };
for (let i = 0; i < 4; i++) assert.equal(claim(state, 'person' + i, allocationDesign, 100).blockId, 'B02');
assert.throws(() => claim(state, 'extra', allocationDesign, 100), /full/);
state.entries.old = { participantId: 'old', blockId: 'B01', status: 'reserved', startedAt: 0, expiresAt: 50 };
assert.equal(claim(state, 'old', allocationDesign, 100).status, 'expired');
assert.equal(state.entries.old.expiresAt, 50);
const html = fs.readFileSync(new URL('../initial.html', import.meta.url), 'utf8');
const mainHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.equal(html.replace(' data-recruitment-batch="initial_4"', '').replace('src="run_survey.js"','src="prolific-entry.js"'), mainHtml);
console.log('Entry checks passed: same questionnaire, batch metadata, release gates, block isolation and local exclusions.');
