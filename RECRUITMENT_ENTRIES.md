# Recruitment entries

UPDATE 2026-09-10: The main Prolific entry now uses server allocation for 95 new
completions. Use index.html?LANG=es with Prolific URL parameters, NOT a fixed
BLOCK_ID. See PROLIFIC_AUTOMATIC_95.md for the authoritative URLs, quotas,
recovery and private export instructions. The fixed-B02 instructions below
describe the previous deployment and must not be used for new recruitment.

These entries share the same questionnaire, stimulus manifest, language support,
randomization and quality rules. The initial four are real participants, not
technical test submissions. Set four places in Prolific; the browser does not
enforce a four-person cap.

## Initial four (Prolific)

```text
https://facadeevaluation.netlify.app/initial.html?LANG=es&PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

Fixed block B01; response rows contain `study_phase: main`,
`recruitment_batch: initial_4`, and `test_submission: false` in production.
Normal quality checks still apply. This batch is not automatically excluded.

## Subsequent Prolific recruitment

```text
https://facadeevaluation.netlify.app/index.html?LANG=es&BLOCK_ID=B02&PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

B02 is an example, not an automatic allocator. Select the block and place count
from the combined coverage report, and reserve that block from NEW local
allocation before recruiting on Prolific. Existing local reservations and
completions must be reconciled. Main-entry B01 is blocked while reserved for the
initial batch. Do not open unlimited Prolific places on a fixed-block link.

## Local recruitment

https://facadeevaluation.netlify.app/local.html?LANG=es

New local assignments exclude B01 via `localExcludedBlocks`. Existing live B01
reservations may finish; saved records are never deleted. Expired B01 reservations
cannot renew. Thus exclusion is not proof that B01 had no earlier local records.
This is planned block separation, NOT a shared automatic cross-channel quota.

## Release and analysis

Changes must be deployed before these URLs reflect this configuration.
Prolific release still requires confirmation of the existing study's completion
and screened-out codes and the outstanding research review facts. Neither
publishing this code nor configuring four places establishes ethics coverage.
No paid recruitment is started by these files.

Prolific responses use Netlify Forms (including its Spam folder); local automatic
responses use private Blobs with a Forms copy. Export both channels for combined
analysis and deduplicate. Check the actual quality and block coverage before
adding places. Never upload participant data to this public repository.

Use `PREVIEW=1` only for non-uploading technical checks, never in participant URLs.
Keep stimulus and questionnaire versions fixed if pooling initial and subsequent
responses; document and assess any substantive changes before combining them.
