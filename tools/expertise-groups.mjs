// Descriptive, self-reported groups, not verification of professional credentials.
export function expertiseGroup(row) {
  const training = row.built_environment_training;
  const experience = row.built_environment_experience;
  const background = row.design_expertise;
  if (!['none', 'current_student', 'completed_qualification', 'other_training'].includes(training)
    || !['none', 'under_1', '1_2', '3_5', '6_10', 'over_10'].includes(experience)
    || !['none', 'training_only', 'experience_only', 'training_and_experience'].includes(background)) return 'unknown';
  const hasTraining = training !== 'none';
  const hasExperience = experience !== 'none';
  const expected = hasTraining ? (hasExperience ? 'training_and_experience' : 'training_only')
    : (hasExperience ? 'experience_only' : 'none');
  if (background !== expected) return 'needs_review';
  const relatedJob = ['architecture', 'urban_design_planning', 'landscape_architecture'].includes(row.professional_field);
  if (relatedJob && !hasExperience) return 'needs_review';
  if (training === 'completed_qualification' && ['1_2', '3_5', '6_10', 'over_10'].includes(experience)) return 'trained_practitioner';
  if (!hasTraining && !hasExperience && !relatedJob) return 'general_public';
  return 'related_background';
}
