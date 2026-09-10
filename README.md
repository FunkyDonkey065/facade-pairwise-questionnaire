# Facade perception questionnaire: 50-scene design

This revision uses **50 Eixample scenes**, 10 single-scene PAD trials and 5 pairwise preference trials per eligible participant. It has two entries: `index.html` for Prolific and `local.html` for direct local recruitment, both currently in **technical upload-test mode**, not formal recruitment. Completion sends a marked test record to Netlify Forms; residence screen-out sends a short test record before images. Only the Prolific entry asks for a Prolific ID; use a dummy ID for rehearsal. Open either HTML file locally to preview without uploading. See **Two Recruitment Entries** below for demographics, individual local invitations and analysis changes, or [the Chinese setup guide](RECRUITMENT_GUIDE.md).

## Barcelona residence screening and completion paths

After consent (and Prolific ID confirmation on that entry only), a required question asks for current usual residence. Only **Barcelona city, within its municipal boundary**, qualifies. Other municipalities in Barcelona province, elsewhere in Spain, outside Spain, and prefer-not-to-answer all end the session before instructions and image ratings. This is a self-report criterion, not independently verified residence. It does not require living in Eixample and does not collect addresses, postcodes or coordinates. Spanish, Catalan and English use the same stored categories. Residence is an eligibility question, never an attention-check failure; no right/wrong feedback or second attempt is given.

In Prolific, select Spain as the country of residence and enable **Custom screening**. Configure paid screen-out slots and the screening reward before recruitment. Include time spent on participant information, consent and ID confirmation when estimating screening duration; do not assume the full screening path takes only the time needed to answer the residence question. The two researcher-supplied completion URLs are configured as follows:

- `completionUrl`, code **C10Z3K88**: eligible participant, all image tasks complete, upload acknowledged.
- `screenOutUrl`, code **C17N2W1E**: residence screening ended the session, no image ratings collected.

The web configuration cannot verify the payment action associated with a Prolific code. Confirm that C17N2W1E is assigned to the paid **Screened out** path, not full completion or a request to return without payment. The production launch check rejects a missing, malformed or shared screen-out URL. Receiving these codes does not change `mode: "upload_test"` or attest to remaining research reviews. Test and preview modes never display payment codes or navigate to Prolific.

Production final pages provide both a return button and a manual completion code. Full-completion return is available only after a successful upload response. If a screening-only upload fails, the participant can retry/download a backup or use the correct screen-out return immediately, so a collector failure does not prevent them registering for screening payment. Reconcile any missing screening record using Prolific and the backup. An HTTP acknowledgement is still not a guarantee that Netlify classified the submission as verified: inspect **both Verified and Spam** and export the records.

The questionnaire version is `facade_50_dual_recruitment_demographics_20260910`; old checkpoints are neither reused nor deleted. Refreshing a screened-out session restores its final screen, never the unvisited image tasks. Submitted sessions do not automatically POST again; explicit retries retain the same submission key. Qualified participants' randomization and the 50-scene manifest are unchanged.

Netlify's hidden form includes `outcome`, `residence_category`, `residence_eligible`, `screening_result`, `participant_id` and `recruitment_source`; redeploy with form detection enabled. These values and `screening_method: "self_report_city_v1"` also appear in the JSON. A complete uninterrupted session has 27 records for Prolific and 26 for local recruitment. A screened-out session has four records for Prolific and three for local recruitment, with its `residence_screening` row carrying the `session_summary`, `outcome: "screened_out"`, and zero image trials. Coverage/preference analyses exclude these records separately from eligible completions. Existing technical-test records remain excluded irrespective of Netlify verification status.

## Rehearse the Prolific ID step

The rehearsal no longer skips the ID page. Opening the site directly requires manual entry of a 24-character hexadecimal ID; for example, `000000000000000000000001`. Empty or incorrectly formatted IDs cannot advance. With a valid `PROLIFIC_PID` in the link, the page displays that ID read-only for confirmation, using the same text-entry component and validation as production. `STUDY_ID` and `SESSION_ID` parameters are captured too. Format validation does not authenticate a Prolific account.

Example using dummy parameters, after deployment:

```text
https://facadeevaluation.netlify.app/?LANG=es&BLOCK_ID=B01&PROLIFIC_PID=000000000000000000000001&STUDY_ID=REHEARSAL&SESSION_ID=REHEARSAL01
```

Rehearsal applies the same minimum starting viewport width as production. Its checkpoints and submission keys contain `dual_recruitment_rehearsal_v1`, and recruitment source is part of the checkpoint identity. Old test checkpoints are not deleted or silently reused. The stimulus manifest remains unchanged. The start/end notices and `study_mode=upload_test` / `test_submission=true` labels intentionally identify the run as a rehearsal. The Prolific rehearsal does not simulate a verified Prolific login, recruitment eligibility, payment or a real return-to-Prolific transaction.

## Enable and verify test uploads

1. The local `study_config.js` now contains `mode: "upload_test"` and `uploadTestHost: "facadeevaluation.netlify.app"`. Commit and push the updated questionnaire files, including `index.html`, to the repository connected to Netlify. A local edit alone does not change the published site.
2. Enable **Forms > Enable form detection** in Netlify, then redeploy. The active form should be named `facade_pairwise_data`. New test fields require a new deploy even if this form already existed.
3. Open the published HTTPS site and confirm the heading is **Questionnaire upload test** (or its Spanish/Catalan translation). Use dummy IDs and ratings, consent to the technical test, confirm or enter the Prolific ID on that entry, finish the questions and click **Send test responses**. Eligible responses upload at this final action; a screening exit uploads its short test record immediately. Failed requests can be retried explicitly.
4. Look in **Forms > facade_pairwise_data**, including Spam if needed. Find the displayed `TEST-...` identifier in `test_session_id`. Expect `study_mode=upload_test`, `test_submission=true`, your dummy ID in `prolific_pid`, any supplied study/session parameters and complete `payload_json` / `payload_csv`. For an eligible completed test, expect 10 PAD trials and 5 preference trials. Also verify a separate non-eligible dummy session: four records, `outcome=screened_out`, and zero image trials. A successful HTTP response is not sufficient proof of dashboard storage.
5. Download and verify the test record, then remove it from Netlify. Only mark `collectorPilotVerified` after verifying actual storage and export. Test data are always excluded by the coverage and preference tools, including when `--include-preview` is supplied.

The local-file/localhost experience remains a non-uploading preview. On the test host, `?PREVIEW=1` also preserves preview behaviour and lets an unexpired old preview session be reopened using the same browser, path, block and Prolific parameters. This URL parameter cannot downgrade or unlock a production study. Preview, upload-test and production checkpoints are separate. Old answers are not silently uploaded or converted to research data; the questionnaire version is unchanged to preserve access to existing preview checkpoints. Downloads, language changes, failure recovery and explicit retry remain available. A submitted session is not automatically sent again on reload; retries use the same submission key, but Netlify may still store duplicates, so check exports by key.

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

Configure adult participants, Spain residence, device requirements and available demographic prescreens in Prolific, and the paid residence screening described above. This version offers Spanish (default), Catalan and English, selectable throughout the questionnaire; `LANG=es`, `LANG=ca` or `LANG=en` sets the initial language. Ensure participants can understand at least one of these languages. Residence within Barcelona is self-reported in the questionnaire, not assumed from country of residence. Demographic quotas require a separate recruitment plan; 100 participants do not support fine-grained age-by-gender-by-education comparisons. Pilot the Spanish and Catalan wording with local speakers; a translated interface is not evidence of psychometric equivalence.

Translations change visible text only, not stored answer values, scene IDs, randomization seeds or the allocation block. Each row records `response_language` (`es`, `ca` or `en`); the final summary records language changes. Keep all three language versions in the same study version, and inspect language-related differences as exploratory results rather than assuming the small language subgroups are comparable. Catalan includes the participant information, consent, comprehension and attention checks, PAD and preference questions, image controls, recovery and submission messages. Have the responsible team review all language versions before setting `participantInformationApproved`.

## Preview, test and formal modes

In `study_config.js`, `mode: "preview"` disables uploads everywhere; `mode: "upload_test"` permits explicitly marked technical uploads only on the configured test host; `mode: "production"` is for formal Prolific collection. To prepare formal collection, supply the real completion URL and verify the participant information and all research review flags. Test mode does not change these flags or prove approval. The review flags are attestations of completed work, not a way to bypass that work. Set geographic verification per scene only after checking the actual coordinates against the chosen sampling area. Freeze the model and the final image manifest together.

The research contact and approximately ten-year retention period reflect the supplied UPC protocol. The subsequently supplied signed CEUPC decision confirms a favourable opinion for **Multi-Objective Optimization for Retrofitting School Facades**, identification code **2026-046**. The committee met on **2026-01-22**; the signature block displays **2026-01-23**. `ethicsReference` is now `CEUPC 2026-046`; the filename prefix `207` is not the identification code. The letter's required acknowledgement is included in Catalan as written, with Spanish and English translations, alongside the reviewed project's original title. This was a text and visual inspection, not cryptographic validation of the digital signature.

The participant-photography authorization in the protocol is not a third-party street-image licence, and the ethics decision does not supply one. Confirm that the actual image agreement covers the intended processing and display, and confirm the external collector and browser-recovery arrangements with the responsible UPC team. Do not upload the signed decision, signed consent forms or the ethical dossier to this public repository.

The 2026-09-10 dossier check used `YanjieLiThesisEthicalCode260119.docx`, its two earlier versions, both supplied reviewer-comment files and the subsequently added `207 CEUPC 22 gener 2026 Dictamen CAT__signed.pdf`. This decision supersedes the initial finding that no final decision had been supplied. The notice also identifies the Department of Architectural Technology, the consent basis, data-protection rights, the protocol's restricted storage/backups and its fully anonymized CORA publication plan. `dataProcessingActivityCode: "F05.4"` records the protocol's processing activity and is deliberately separate from `ethicsReference`; it is not the ethics identification code. Response metadata records `protocol_source_document`, `data_processing_activity_code`, `ethics_reference`, `ethics_project_title`, `ethics_source_document`, `ethics_committee_meeting_date` and `ethics_signed_date`. These are source/traceability fields, not confirmation that a processor arrangement or the current questionnaire implementation has been approved. The decision does not identify an exact protocol filename/version.

The dossier does not document Netlify/Prolific processing or exclusion of the current 50 scenes from model training. Its non-expert consent describes paired alternatives for the same school without scores, whereas this questionnaire uses distinct Eixample scenes plus PAD ratings. It also describes signed identity-bearing forms and professional-background exclusions that need reconciliation with the actual Prolific recruitment procedure. **The decision explicitly requires a new review request for any extension in time or content.** Reconcile the current dates, stimuli/tasks, compensation, recruitment and data flow with the approved protocol and any subsequent amendments before recruitment. This does not negate the confirmed favourable opinion; it prevents treating it as blanket approval for later changes. `participantInformationApproved`, `imageUseReviewed`, `independentStimuliVerified` and `collectorPilotVerified` remain false. The preview notice identifies the remaining scope check. Do not silently copy identity fields into the questionnaire or mark review flags true. The revised notice uses questionnaire version `facade_50_trilingual_upc_20260910_approval`, so older preview consent/checkpoints are not reused as consent to the revised information.

The decision also requires publication of results whether positive or negative, inclusion of the sex variable where possible and appropriate disaggregation when publishing human data, and sending publications that refer to the opinion to CEUPC. Reconcile any demographic collection with the approved protocol, consent and data-minimisation plan; the decision is not a reason to add an unreviewed identity or demographic question automatically.

GitHub Pages can serve previews but does not implement the current response collector. The supported collector is Netlify Forms. Enable form detection, deploy the static hidden form from `index.html`, send a clearly marked test response, and verify its complete JSON payload in the Netlify dashboard/export. Mark `collectorPilotVerified` only after that check. A browser HTTP success response alone is not evidence of correct long-term storage. Server-side duplicate prevention is not supplied: retries carry the same submission key and must be deduplicated during export.

The new `images/study_50` folder contains only the 200 stimulus JPEGs; it does not contain model ratings or coordinate metadata. Older image folders, JSON files, logs and backups in the existing repository were not deleted by this revision. Exclude those legacy research files from the published build and review any existing public history before recruitment. Private provenance is stored outside this web directory in the research workspace.

The screen load check disables ratings until all four/eight images are available. The main `_f` image is shown once; its plain same-heading duplicate is excluded. Context views are ordered right, back, left relative to the main heading. Images can be enlarged. No unjudgeable answer is converted to a neutral score.

Two simple attention checks are recorded without automatic rejection. The comprehension check offers two attempts with the instructions visible. Declining consent or failing comprehension does not upload response data or issue a completion code. Failed uploads allow retry and a response backup; the success completion link is shown only after a successful submission response. These controls do not replace pilot collection or researcher review of technical failures.

## Local recovery

After consent, completed trials and the current unsubmitted selections are checkpointed in this browser's local storage. Reopening the same link in the same browser/profile offers resume without regenerating the task order. The cache is keyed by questionnaire version, image manifest, study mode, path and Prolific link identifiers. Changing these identifiers or updating the study version creates a different session. Recovery expires 24 hours after the last activity; an expired entry is removed when the survey next opens. A closed web page cannot run a timed physical deletion.

No answer cache is written before consent. A participant may download a progress backup or delete the current local session. The progress backup contains completed rows and an unfinished draft, is marked `progress_backup`, and is NOT a completed response accepted by the analysis tool. There is no automatic file-import facility: the researcher must reconcile a progress backup privately. Final JSON/CSV backups contain all completed trials, including trials recovered after a refresh.

On compatible browsers, a Web Lock allows only one active tab for a session; an optimistic revision check also guards against stale writes. Storage failures show a warning and leave the in-memory answers downloadable. This is not cloud backup and cannot survive cleared site data, private-mode cleanup, changing devices, or storage being disabled. Do not promise recovery in those cases. HTTP submission failures retain the complete local session and allow retry with the same `submission_key`; the collector may still contain duplicates after an ambiguous network failure. Deduplicate exports, and never put identifiable responses in GitHub.

Recovery adds `interrupted_question`, `prior_page_duration_ms`, `resume_count` and `session_trial_index`. The plugin's `rt` measures the current page visit, not uninterrupted total task time. Treat interrupted-trial timing separately; a page left in the background is not active response time. The locally stored copy remains recoverable after an HTTP success until expiry or explicit deletion, so that a response backup remains available.

## Verification and coverage

Run from the questionnaire directory:

```powershell
node tools/check-design.mjs
node tools/test-coverage.mjs
node tools/test-recovery.mjs
node tools/test-preference.mjs
node tools/test-i18n.mjs
python tools/test_preference.py
node tools/coverage-report.mjs C:\PRIVATE\survey-responses
```

The coverage tool accepts one downloaded trial-array JSON per participant, or a JSON object containing `payload_json`. Netlify CSV exports must first be parsed with a CSV parser and each payload extracted. Never store participant exports in the public repository. Preview data are excluded by default; `--include-preview` is for local tests. Output includes scene shortfalls, independent-rater counts, graph connectivity, block top-up suggestions and duplicate/mismatch flags. It provisionally excludes two failed attention checks for analysis review; it does not make payment or rejection decisions. Rows marked `somewhat` count as usable in the current report; preregister a sensitivity analysis excluding them.

## Analysis and interpretation

For PAD, divide the seven-point response by 3 to compare with the model's [-1,1] output, while acknowledging the ordinal-to-interval assumption. Treat these as adapted PAD items matching the model's operational definitions, not automatically as a validated multi-item PAD instrument. Aggregate by scene and estimate reliability with methods that allow missing-by-design ratings; do not apply a complete-matrix ICC mechanically.

For preference, report agreement with the model's pairwise ordering and, if estimating scene ranks, use a prespecified Bradley-Terry extension accommodating ties (such as Davidson). Strong/slight choices are ordinal; do not assume their distances are equal. The sparse graph is connected but has only five opponents per scene, so ranking uncertainty must be reported. Raw choices in [-2,2] are not on the model's [1,10] preference scale. Do not calculate preference MAE/RMSE by equating those scales or by calibrating on the validation responses.

An executable proposed analysis is supplied in [PREFERENCE_ANALYSIS.md](PREFERENCE_ANALYSIS.md): directional concordance, separate human-tie statistics, participant bootstrap within allocation blocks and secondary regularized Davidson rankings with Spearman/Kendall comparisons. Approve and freeze this plan before examining formal responses; the presence of the code is not preregistration. Scripts require Python, NumPy and SciPy for the analysis, but the participant website does not require Python or any new online library.

The 50 scenes are the stimulus-level sample size for model-versus-human correlations, not the 1,000 PAD records or 500 pair choices. Participant reuse and geographic clustering must be reflected in uncertainty estimates. The design targets a resource-constrained local validation, not proof of cross-cultural generalization.

Sources: [Lakens, Sample Size Justification](https://doi.org/10.1525/collabra.33267); [Prolific attention and comprehension policy](https://researcher-help.prolific.com/en/articles/445153-prolific-s-attention-and-comprehension-check-policy); [Netlify Forms setup](https://docs.netlify.com/manage/forms/setup/); [UPC research data protection](https://dadesrecerca.upc.edu/ca/protegeix).
# Two Recruitment Entries (2026-09-10)

- `index.html` remains the Prolific entry. `local.html` is the independent local-recruitment entry. Both use the SAME scenes, block design, PAD/preference tasks, attention checks, language selector and recovery/collector code. No images or scoring scales changed.
- `mode` controls Prolific; `localMode` controls local recruitment. Both currently remain `upload_test`. Do not change research-review flags merely to bypass the launch check. Reconcile the revised optional demographic questions and direct recruitment with participant information first. A successful mock test does not verify Netlify dashboard storage.
- The local entry states voluntary participation, does not mention remuneration, never asks for a Prolific ID and never displays a Prolific completion code/redirect. Consent, Barcelona-city screening and the desktop/laptop requirement apply to both entries. Local recruitment is not offline storage: the hosted page needs internet access to submit.
- Formal local recruitment requires an individual `LOCAL_ID=L-<32 lowercase hex characters>` and a fixed `BLOCK_ID=B01-B25`. The bare `local.html?LANG=es` page is usable for technical preview/upload testing, but is not a quota-managed production link. A production local invitation cannot be mixed with Prolific URL parameters. A URL parameter cannot change an entry's recruitment source or unlock production.

Generate private individual invitations from the repository directory:

```powershell
node tools/make-local-invitations.mjs C:\PRIVATE\local-invitations.json 4
```

This creates a private JSON file and a clickable Markdown list, 4 invitations per block, 100 in total. Use one link per person, including on shared computers. Do not publicly post the invitation list or send one individual link to multiple people. Distribute across all 25 blocks before adding more within a block. For a 25-platform/75-local design, use 3 per block instead; this is an allocation example, not a required recruitment ratio. Re-running generates NEW IDs, so retain the original list and never substitute a new ID for the same person's unfinished survey.

Invitation IDs support recovery and analysis deduplication, not authentication. Static hosting has no global quota reservation or server-side single-use enforcement. The same code may be submitted twice from different devices; analysis excludes repeated participant IDs. It cannot detect the same person using two invitations or participating once locally and once through Prolific. Keep a restricted recruitment log, ask for one participation only, and check coverage before top-ups. Keep any contact/linkage records separate from responses and out of Git/Netlify public files.

## Optional Demographics

One optional page follows all ratings and both attention checks, before final submission. No demographic answer changes eligibility or attention scoring. Blank answers are allowed; no defaults are preselected.

| Variable | Prolific entry | Local entry |
| --- | --- | --- |
| Age | Prolific export, then derive age bands | Age bands: 18-24, 25-34, 35-44, 45-54, 55-64, 65+ |
| Gender identity | Optional questionnaire question | Same optional question |
| Highest completed education | Selected Prolific education prescreener export | Optional education question |
| Formal training/professional experience in architecture, urban design/planning or landscape architecture | Optional questionnaire question | Same optional question |
| Total time living in Barcelona city | Optional questionnaire question | Same optional question |

All questions/options are available in ES/CA/EN. Translation changes labels, not stored codes. Prolific's default `Sex` field is NOT recoded into `gender_identity`; keep it separate. The prior ethics decision's sex-variable recommendation needs explicit review, not relabelling gender identity as sex. No birth date, exact address, name or email is requested. Allow roughly an extra 30-90 seconds for this page as a planning allowance, not a measured completion time; re-pilot both entry routes before setting study timing.

Before launching Prolific, add the required education prescreener and select all intended education categories. Check that it is included in the demographic download selection; age is in the base export. Exports are not sent to Netlify automatically. Join the Prolific export `Participant ID` to `prolific_pid` in a restricted analysis copy, derive `age_band`, and document a category mapping for education after inspecting actual export labels. Retain raw education labels and collection source; do not silently equate incompatible national qualifications. Missing/withdrawn export data stay missing. See [Prolific demographic export documentation](https://researcher-help.prolific.com/en/articles/445209-exporting-prolific-demographic-data).

New response fields include `participant_id`, `recruitment_source` (`prolific`/`local`), `demographics_version`, `demographics_status`, `age_data_source`, `education_data_source`, `age_band`, `gender_identity`, `education_level`, `design_expertise`, and `barcelona_residence_duration`. The form/dashboard exposes participant ID and recruitment source; demographic answers are in `payload_json` and `payload_csv`. `prolific_pid` is empty for local records, never a fabricated platform ID. Age and education in raw Prolific records are `external_pending` with source `prolific_export_pending`, not fabricated values.

Missingness codes: `not_answered` = optional question left blank; `prefer_not_to_answer` = explicit decline; `not_collected` = question page not reached; `external_pending` = separate platform export needed. Screened-out participants never see demographics or images. Completed local sessions contain 26 rows (10 PAD + 5 preference); Prolific sessions contain 27 rows because they also confirm the platform ID. Local/Prolific screen-outs have 3/4 rows respectively. `record_type=session_summary` identifies the final record; do not infer completeness from row count alone.

```powershell
node tools/coverage-report.mjs C:\PRIVATE\responses
node tools/participant-report.mjs C:\PRIVATE\responses C:\PRIVATE\participants.json
node tools/prepare-preference.mjs C:\PRIVATE\responses C:\PRIVATE\preference-input.json
node tools/test-dual-recruitment.mjs
```

Coverage now reports participants and fully usable block completions by source. Participant export yields one row per accepted person; preference export includes `recruitment_source` and namespaced analysis IDs (`local:L-...` / `prolific:...`). Existing platform-only records remain readable. Test responses remain excluded. Optional missing demographics do not exclude otherwise usable ratings. Report recruitment-source composition and check source-stratified sensitivity when comparing model/human results; these convenience samples are not automatically representative of Barcelona residents.

Redeploy both HTML entry files and all changed shared scripts to Netlify. Both static forms use the same `facade_pairwise_data` schema. Verify one complete record and one screen-out record per entry in Netlify Forms (including Spam), then retain actual pilot/review evidence before enabling either production switch. Never upload the private invitation list, response exports, demographic joins or ethics documents to the public repository.
