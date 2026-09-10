import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { expertiseGroup } from './expertise-groups.mjs';
const context = { window: {}, jsPsychModule: { ParameterType: { STRING: 1, OBJECT: 2 } } };
vm.runInNewContext(fs.readFileSync(new URL('../demographics.js', import.meta.url), 'utf8'), context);
const api = context.window.SurveyDemographics;
assert.equal(api.forSource('prolific').length, 8);
assert.deepEqual(api.forSource('local'), api.forSource('prolific'));
for (const source of ['local', 'prolific']) {
  const answers = { demographics_version: 'facade_demographics_v2', ...Object.fromEntries(api.forSource(source).map(field => [field.name, field.options[0][0]])) };
  const meta = api.metadata(source, answers);
  for (const [key, value] of Object.entries(answers)) assert.equal(meta[key], value);
  assert.equal(meta.demographics_version, 'facade_demographics_v2');
  assert.equal(meta.age_data_source, 'questionnaire');
}
const expert = { design_expertise: 'training_and_experience', built_environment_training: 'completed_qualification',
  built_environment_experience: '3_5', professional_field: 'architecture' };
assert.equal(expertiseGroup(expert), 'trained_practitioner');
assert.equal(expertiseGroup({ ...expert, built_environment_training: 'current_student' }), 'related_background');
assert.equal(expertiseGroup({ ...expert, built_environment_experience: 'under_1' }), 'related_background');
assert.equal(expertiseGroup({ ...expert, built_environment_experience: 'none' }), 'needs_review');
assert.equal(expertiseGroup({ design_expertise: 'none', built_environment_training: 'none',
  built_environment_experience: 'none', professional_field: 'other_field' }), 'general_public');
assert.equal(expertiseGroup({}), 'unknown');
assert.equal(expertiseGroup({ ...expert, built_environment_training: 'prefer_not_to_answer' }), 'unknown');
console.log('Demographics v2: common fields, metadata, missing answers and descriptive expertise groups passed.');
