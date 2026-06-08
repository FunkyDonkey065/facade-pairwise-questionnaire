# jsPsych Pairwise Facade Experiment

This is a static jsPsych experiment for Prolific + pairwise facade comparison.

It is designed for the validation described in `Skeleton_of_Project_20260605.docx`:

- target: Organism-stage predictions only
- dimensions: pleasure, arousal, dominance, preference
- method: pairwise comparison
- recommended task length: 10 image pairs per participant
- recommended Prolific estimate: 9 minutes

## Why Netlify Is Preferable

GitHub Pages can host the experiment because it serves static HTML, CSS, and JavaScript. However, GitHub Pages does not provide a backend for saving participant data.

Netlify can also host the same static files, and Netlify Forms can collect submissions without writing a backend. This template includes a hidden Netlify form named `facade_pairwise_data`.

Recommended:

1. Use Netlify for the real Prolific study.
2. Use GitHub Pages only for preview/testing, unless you add another data endpoint such as Google Apps Script, Firebase, Supabase, or JATOS.

Official docs checked:

- jsPsych data and URL variable tools: https://www.jspsych.org/v8/reference/jspsych-data/
- jsPsych initialization: https://www.jspsych.org/v8/reference/jspsych/
- GitHub Pages static hosting: https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/what-is-github-pages
- Netlify deploys: https://docs.netlify.com/deploy/create-deploys/
- Netlify Forms setup: https://docs.netlify.com/forms/setup/

## Files

- `index.html`: page shell, hidden Netlify form, jsPsych scripts.
- `style.css`: visual layout.
- `pairs.js`: pair schedule and placeholder images.
- `experiment.js`: experiment logic, data recording, Netlify submission, Prolific redirect.
- `images/README.md`: where real facade images should go.

## How To Add Real Images

Put images in:

```text
jspsych_pairwise_facade/images/
```

Example:

```text
images/facade_001.jpg
images/facade_002.jpg
```

Then edit `pairs.js`.

Each pair should look like:

```javascript
{
  pair_id: "P001",
  set_id: "S01",
  image_A_id: "F001",
  image_A_url: "images/facade_001.jpg",
  image_B_id: "F014",
  image_B_url: "images/facade_014.jpg"
}
```

For the real study, prepare around 60 pair sets if recruiting 60 participants, with 10 pairs per set. You can assign participants to sets automatically using the `SESSION_ID` or a random fallback.

## Context Metadata

The task now tells participants that the images are urban street scenes from Barcelona, Catalonia, Spain, and asks them to compare the target facade within the visible street context.

For the 2026-04-29 image pipeline, use the processed scene structure:

- `frame_<heading>_f.jpg`: marked main facade selected by `selection_result.json`.
- `frame_<heading>.jpg`: unmarked street-view heading images.
- The unmarked image with the same heading as the marked main facade is a duplicate view and should be excluded from the context display.

Use `export_streetview_photos_only.py` in survey-ready mode from the project root:

```text
python export_streetview_photos_only.py --survey-ready --source jspsych_pairwise_facade/images/streetview_photos_with_f --output jspsych_pairwise_facade/images/survey_ready_streetview_scenes --manifest-js jspsych_pairwise_facade/scene_manifest.js --no-zip
```

This creates one marked main-facade image plus three non-duplicate context images per scene, and writes `scene_manifest.js` for the experiment.

When you replace the placeholder images, update `IMAGE_CONTEXT` in `pairs.js` if any image needs a more specific context note:

```javascript
const IMAGE_CONTEXT = {
  F001: {
    location: "Barcelona, Catalonia, Spain",
    context: "Narrow mixed-use street with continuous street wall and active ground floor."
  }
};
```

For the formal study, each target facade should be clearly marked, outlined, or consistently centered so that participants compare the same facade that the model evaluates.

## Randomization And Fairness

For each participant/session, the experiment now:

- assigns a `pair_set_id` from `SESSION_ID` or `PROLIFIC_PID`;
- randomizes the order of pairs within the assigned set;
- balances and randomizes Image A / Image B positions within each participant's task;
- randomizes the display order of the four dimensions;
- records `randomization_seed`, `dimension_order`, `source_order_index`, `display_order_index`, `a_b_swapped`, `original_image_A_id`, and `original_image_B_id`.

This keeps the task reproducible for a given Prolific/session ID while reducing order effects and left/right response bias.

## Prolific URL

Use a URL like this in Prolific:

```text
https://YOUR-SITE.netlify.app/?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

Set `PROLIFIC_COMPLETION_URL` in `experiment.js` before launch.

The experiment includes a dedicated Prolific ID page after consent. It is prefilled from `PROLIFIC_PID` when participants enter through Prolific, and it still records a manually entered ID during preview or testing.

## Netlify Deployment

Fastest deployment:

1. Go to Netlify.
2. Drag the whole `jspsych_pairwise_facade` folder into Netlify Drop.
3. Open the deployed URL.
4. Submit one test response.
5. Check Netlify dashboard -> Forms -> `facade_pairwise_data`.

More robust deployment:

1. Put `jspsych_pairwise_facade` in a GitHub repository.
2. Connect the repository to Netlify.
3. Build command: leave empty.
4. Publish directory: `jspsych_pairwise_facade` if it is inside a larger repo, or `.` if it is the repo root.

## GitHub Pages Deployment

GitHub Pages is okay for preview:

1. Put these files in a GitHub repository.
2. Go to repository Settings -> Pages.
3. Deploy from branch.
4. Select the branch and folder containing `index.html`.

But remember: GitHub Pages alone will not save participant data. Use Netlify or add a data endpoint before running Prolific.

## Recommended Prolific Setup

Use Prolific prescreening:

- Age: 18+.
- Country/residence: Spain, or Barcelona/Catalonia if available in Audience Checker.
- Language fluency: survey language.
- Gender/education quotas only if needed.
- Approval rate: high, e.g. 95%+ if available.

Device:

- In Prolific Study Details: Desktop only.
- In Prolific description: state that mobile phones/tablets are not suitable.
- In this experiment: participants confirm device at the start.

Estimated duration:

- Consent/instructions/device/comprehension: 2-3 min.
- 10 pairwise trials: 4.5-6 min.
- Attention checks and redirect: 0.5-1 min.
- Advertise as 9 minutes.

Pilot with 5-10 participants first. If median time is above 10 minutes, reduce to 8 pairs or increase payment.
