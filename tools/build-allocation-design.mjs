import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { root, loadDesign } from './design.mjs';

const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'study_config.js'), 'utf8'), context);
const { manifest, blocks } = loadDesign();
const source = fs.readFileSync(path.join(root, 'experiment.js'), 'utf8');
const match = source.match(/const SURVEY_VERSION = "([^"]+)"/);
if (!match || blocks.length !== 25 || !blocks.every(b => b.pad_ids.length === 10 && b.pairs.length === 5)) throw Error('Unexpected questionnaire design');
const config = context.window.STUDY_CONFIG;
const design = {
  surveyVersion: match[1], fingerprint: manifest.fingerprint,
  campaign: 'local-auto-v1-' + manifest.fingerprint,
  host: config.uploadTestHost,
  enabled: config.localMode === 'production' && config.localAutomaticAllocation === true,
  targetPerBlock: 4, leaseMs: 45 * 60 * 1000, maximumLeaseMs: 24 * 60 * 60 * 1000,
  blocks: blocks.map(b => ({ id: b.set_id, padIds: b.pad_ids, pairs: b.pairs }))
};
fs.mkdirSync(path.join(root, 'netlify/lib'), { recursive: true });
fs.writeFileSync(path.join(root, 'netlify/lib/allocation-design.json'), JSON.stringify(design, null, 2) + '\n');
console.log('Allocation design: 25 blocks x 4 locally recruited usable completions.');
