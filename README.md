# jsPsych Facade Perception Experiment

This static jsPsych experiment is designed for Prolific + Netlify deployment.

The current version separates the two validation targets:

- PAD is collected as single-image Likert ratings.
- Overall preference is collected as pairwise comparison.

This avoids treating PAD as a comparative judgement. Showing two images at the same time can create contrast and anchoring effects, so PAD ratings are now collected with one target facade on screen at a time. Pairwise display is retained only for preference, where comparison is the intended measurement.

## Files

- `index.html`: page shell, hidden Netlify form, jsPsych scripts.
- `style.css`: visual layout.
- `pairs.js`: pair schedule and image metadata resolver.
- `scene_manifest.js`: survey-ready Barcelona image manifest.
- `experiment.js`: experiment logic, data recording, Netlify submission, Prolific redirect.
- `images/`: survey images.

## Data Structure

The exported jsPsych data contains multiple task types:

- `task = "pad_likert"` for single-image PAD ratings.
- `task = "pairwise_preference"` for two-image preference comparisons.
- `screen = ...` for consent, instruction, ID, device, and attention-check pages.

For PAD trials, the key fields are:

- `image_id`, `scene_id`, `selected_heading`
- `pleasure_likert`, `arousal_likert`, `dominance_likert`
- `pleasure_norm`, `arousal_norm`, `dominance_norm`
- `judgeability`
- `rt`

The Likert scale runs from -3 to +3. The normalized fields divide the raw score by 3, giving values in [-1, 1] for direct comparison with PAD model outputs.

For pairwise preference trials, the key fields are:

- `pair_id`, `pair_set_id`
- `image_A_id`, `image_B_id`
- `preference_choice`
- `preferred_image_id`
- `preference_strength`
- `judgeability`
- `a_b_swapped`
- `rt`

`preference_choice` uses:

- `-2`: strongly prefer Image A
- `-1`: slightly prefer Image A
- `0`: about the same
- `1`: slightly prefer Image B
- `2`: strongly prefer Image B

## Randomization

For each participant/session, the experiment:

- assigns a `pair_set_id` from `SESSION_ID` or `PROLIFIC_PID`;
- randomizes the order of pairs within the assigned set;
- balances and randomizes Image A / Image B positions;
- constructs the PAD image list from the facades appearing in the assigned pair set;
- randomizes the order of PAD images;
- randomizes the order of PAD dimensions.

The data records `randomization_seed`, `pair_set_id`, `pad_scene_order`, `pad_dimension_order`, `a_b_swapped`, `original_image_A_id`, and `original_image_B_id`.

By default, each participant rates 6 single-image PAD trials and 8 pairwise preference trials. This keeps the task close to the original time budget while separating PAD from preference. For preview or pilot tuning, add `PAD_TRIAL_LIMIT` to the URL, for example:

```text
https://YOUR-SITE.netlify.app/?PAD_TRIAL_LIMIT=4
```

For the formal study, omit this parameter to use the default 6 PAD trials. If you recruit about 150 participants and need roughly 20 PAD ratings per 50 scenes, use `PAD_TRIAL_LIMIT=7`; if payment time is tighter, keep the default 6 and treat PAD reliability as slightly lower but still usable for a pilot/first validation.

## Netlify Deployment

Use Netlify for the real Prolific study because GitHub Pages does not save form submissions.

Fast deployment:

1. Go to Netlify.
2. Drag this repository folder into Netlify Drop.
3. Open the deployed URL.
4. Submit one test response.
5. Check Netlify dashboard -> Forms -> `facade_pairwise_data`.

GitHub Pages is suitable for preview only unless you connect a separate data endpoint.

## Prolific URL

Use a URL like this in Prolific:

```text
https://YOUR-SITE.netlify.app/?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

Set `PROLIFIC_COMPLETION_URL` in `experiment.js` before launch.

## Recommended Use In The Paper

Use PAD Likert means to validate the model's Organism-stage PAD predictions.

Use pairwise preference responses to estimate a human preference signal. If a scalar scene-level preference score is needed, fit a Bradley-Terry or Thurstone model to the pairwise choices, then compare the resulting latent preference score with the model's predicted preference.

Do not interpret the P1-P9 design-action outputs as validated by this questionnaire; they require a separate professional/expert validation.
