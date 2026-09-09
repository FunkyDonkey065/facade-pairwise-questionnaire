# Facade perception questionnaire: 50-scene design

This revision uses **50 Eixample scenes**, 10 single-scene PAD trials and 5 pairwise preference trials per participant. It currently runs in **preview mode** and does not upload responses or issue a Prolific completion code. Open `index.html` directly to preview; dependencies are bundled locally.

The active images come from the frozen `eixample_20260909_v1` export: 50 scenes selected from 67 scenes passing the automatic geography and facade checks, using `main_facade_automatic_polygon_v12_xy1000`. They replace the previous geographically unverified test candidates. The selected panorama locations lie within the Eixample sampling boundary and satisfy the 80 m minimum-distance rule. Each scene has one marked main facade and three context views; the unmarked same-heading duplicate is excluded. Automated acceptance does not guarantee perfect facade boundaries, distinct building identities across scenes, or exclusion from the model's training data. Those limitations and the remaining research approvals must be addressed before recruitment.

The frozen stimulus fingerprint is `2da164798817dacc924c6ee2d025656bb6d92a8947e42916d6038fc309a49aa3`. Keep this manifest fixed during collection, and generate model predictions against these exact stimuli; predictions or pilot responses from the old candidates must not be pooled as if the images were unchanged.

## What the design guarantees

| Quantity | Planned value |
|---|---:|
| Distinct scenes | 50 |
| PAD trials per participant | 10, with P/A/D on each trial |
| Preference trials per participant | 5 |
| Blocks | 25, B01-B25 |
| Fully usable independent participants per block | 4 |
| Total fully usable participants | 100 |
| PAD raters per scene with complete quotas | 20 |
| Preference comparison appearances per scene | 20 |
| Distinct opponents per scene | 5 |
| Distinct compared pairs | 125 |
| Independent comparisons per pair | 4 |

Every block contains ten distinct scenes, used in both tasks. Task order, PAD scene order, pair order and the order of the three PAD questions are seeded and randomized. Each five-pair block swaps two or three A/B assignments; which count occurs is randomized. The comparison graph is connected. Sharing stimuli across tasks still permits carry-over effects; task order is recorded for sensitivity analysis.

This is an **exposure-balanced incomplete allocation**, not a strict balanced incomplete block design (BIBD). Scene co-occurrence is not identical for every possible pair. Equal planned exposure is not a guarantee of equal valid data after withdrawals, unjudgeable images or exclusions.

## Recruitment and allocation

The formal survey requires a fixed `BLOCK_ID=B01` through `BLOCK_ID=B25`. Use 25 disjoint Prolific batches with four fully usable participants per block, excluding prior participants from subsequent batches, or an independently tested server allocator that enforces the same quotas. Do not infer quotas from a random hash of participant IDs. The automatic block selection in preview mode is for demonstration only.

Example link structure, after hosting with a working collector:

```text
https://YOUR-COLLECTION-HOST/?BLOCK_ID=B01&PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

The present implementation does not centrally reserve blocks or prevent one participant joining multiple independently created Prolific batches. Use Prolific recruitment controls and deduplicate exports. Four recruited participants per block may yield fewer than four fully usable completions. Check coverage and replenish shortfalls when affordable. Do not repeatedly test returning participants as if they were independent raters.

Configure adult participants, the actual target residence, device restrictions and available demographic prescreens in Prolific. This version is in English: use an explicit English-language eligibility requirement or complete a tested Spanish/Catalan translation before recruiting the corresponding population. Residence within Barcelona must be verified through an available prescreen or an appropriately configured screening procedure, not assumed from country of residence. Demographic quotas require a separate recruitment plan; 100 participants do not support fine-grained age-by-gender-by-education comparisons.

## Preview and formal mode

In `study_config.js`, keep `mode: "preview"` for local testing. To prepare formal collection, supply the real completion URL, retention period, research contact and ethics approval/exemption reference. The review flags are attestations of completed work, not a way to bypass that work. Set geographic verification per scene only after checking the actual coordinates against the chosen sampling area. Freeze the model and the final image manifest together.

GitHub Pages can serve previews but does not implement the current response collector. The supported collector is Netlify Forms. Enable form detection, deploy the static hidden form from `index.html`, send a clearly marked test response, and verify its complete JSON payload in the Netlify dashboard/export. Mark `collectorPilotVerified` only after that check. A browser HTTP success response alone is not evidence of correct long-term storage. Server-side duplicate prevention is not supplied: retries carry the same submission key and must be deduplicated during export.

The new `images/study_50` folder contains only the 200 stimulus JPEGs; it does not contain model ratings or coordinate metadata. Older image folders, JSON files, logs and backups in the existing repository were not deleted by this revision. Exclude those legacy research files from the published build and review any existing public history before recruitment. Private provenance is stored outside this web directory in the research workspace.

The screen load check disables ratings until all four/eight images are available. The main `_f` image is shown once; its plain same-heading duplicate is excluded. Context views are ordered right, back, left relative to the main heading. Images can be enlarged. No unjudgeable answer is converted to a neutral score.

Two simple attention checks are recorded without automatic rejection. The comprehension check offers two attempts with the instructions visible. Declining consent or failing comprehension does not upload response data or issue a completion code. Failed uploads allow retry and a response backup; the success completion link is shown only after a successful submission response. These controls do not replace pilot collection or researcher review of technical failures.

## Verification and coverage

Run from the questionnaire directory:

```powershell
node tools/check-design.mjs
node tools/test-coverage.mjs
node tools/coverage-report.mjs C:\PRIVATE\survey-responses
```

The coverage tool accepts one downloaded trial-array JSON per participant, or a JSON object containing `payload_json`. Netlify CSV exports must first be parsed with a CSV parser and each payload extracted. Never store participant exports in the public repository. Preview data are excluded by default; `--include-preview` is for local tests. Output includes scene shortfalls, independent-rater counts, graph connectivity, block top-up suggestions and duplicate/mismatch flags. It provisionally excludes two failed attention checks for analysis review; it does not make payment or rejection decisions. Rows marked `somewhat` count as usable in the current report; preregister a sensitivity analysis excluding them.

## Analysis and interpretation

For PAD, divide the seven-point response by 3 to compare with the model's [-1,1] output, while acknowledging the ordinal-to-interval assumption. Treat these as adapted PAD items matching the model's operational definitions, not automatically as a validated multi-item PAD instrument. Aggregate by scene and estimate reliability with methods that allow missing-by-design ratings; do not apply a complete-matrix ICC mechanically.

For preference, report agreement with the model's pairwise ordering and, if estimating scene ranks, use a prespecified Bradley-Terry extension accommodating ties (such as Davidson). Strong/slight choices are ordinal; do not assume their distances are equal. The sparse graph is connected but has only five opponents per scene, so ranking uncertainty must be reported. Raw choices in [-2,2] are not on the model's [1,10] preference scale. Do not calculate preference MAE/RMSE by equating those scales or by calibrating on the validation responses.

The 50 scenes are the stimulus-level sample size for model-versus-human correlations, not the 1,000 PAD records or 500 pair choices. Participant reuse and geographic clustering must be reflected in uncertainty estimates. The design targets a resource-constrained local validation, not proof of cross-cultural generalization.

Sources: [Lakens, Sample Size Justification](https://doi.org/10.1525/collabra.33267); [Prolific attention and comprehension policy](https://researcher-help.prolific.com/en/articles/445153-prolific-s-attention-and-comprehension-check-policy); [Netlify Forms setup](https://docs.netlify.com/manage/forms/setup/); [UPC research data protection](https://dadesrecerca.upc.edu/ca/protegeix).
