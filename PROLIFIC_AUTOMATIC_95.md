# Prolific automatic allocation for 95 new completions

## Participant URL

https://facadeevaluation.netlify.app/index.html?LANG=es

In Prolific, enable automatic URL parameters named PROLIFIC_PID, STUDY_ID and SESSION_ID. Alternatively enter the explicit placeholder URL, without also appending a second set of parameters:

```
https://facadeevaluation.netlify.app/index.html?LANG=es&PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

Do not include BLOCK_ID, LOCAL_ID or PREVIEW. The server assigns BLOCK_ID before the unchanged questionnaire starts. An old B02 main-entry link now also receives a server assignment, rather than forcing B02. initial.html remains the old fixed B01 entry; do not use it to recruit the remaining participants.

For a technical preview only: index.html?LANG=es&PREVIEW=1. It neither allocates a production place nor uploads responses.

## Quotas and scope

B01: zero new places. B02-B24: four each. B25: three. Total: 95 new completed questionnaires, counted irrespective of quality flags. With five retained initial B01 responses, the planned Prolific total is 100. This does not count local recruitment, screened-out participants, or exclusions after researcher review. Actual usable scene coverage still needs analysis.

Set 95 NEW completed places on Prolific, or a total of 100 if increasing the original study that already has five completions. Retain the existing completion and screening codes only when they match that study. This implementation does not change Prolific's study settings, money, approval or rejection decisions. Across different Prolific studies, exclude previous participants using Prolific recruitment settings; the new allocator has not imported the five initial participants' identities.

local.html is unchanged and has a separate quota store. Local participation is additional data, NOT part of the remaining 95 Prolific quota. If the scientific target is 100 across both channels, reconcile existing local responses and change the recruitment plan first.

## Lifecycle

- A GET does not reserve a place. Continue allocates with conditional writes and strong consistency.
- A Prolific ID has one assignment in this campaign, bound to its study/session and necessary browser cookie. Refreshing preserves the block. Another browser cannot access the existing response; it shows a recovery/contact message instead of creating a second assignment.
- A consent refusal, comprehension return or technical stop explicitly releases the assignment. A saved residence screen-out also releases it.
- Closing a browser is NOT proof of withdrawal. A reservation lasts up to 24 hours; navigation away does not immediately release it. The server cannot see Prolific Returned status without a separate integration. Use the private management tool only after verifying a participant has actually returned/timed out on Prolific.
- After expiry, a participant never silently receives a different block. An already-expired session cannot extend beyond the 24-hour maximum. Contact the researcher for recovery.
- Late completed answers are preserved and marked late_review. They do not silently overwrite a replacement or disappear. Human review may result in more than 95 saved complete/late records; 95 is the controlled in-time quota, not a promise that no late record can ever arrive.
- Quota-full is a technical recruitment condition, NOT a paid residence screen-out. The page asks participants to contact the researcher and return the study.
- No automatic payment or rejection decisions are made from attention checks.

## Storage and export

Authoritative response store: private Netlify Blobs `facade-prolific-responses`. Assignment store: `facade-prolific-allocation`. Campaign: `prolific-remaining95-v1-` plus the current manifest fingerprint.

An immutable response is saved before completion is counted. A retry with the same response hash is idempotent; conflicting copies are not silently overwritten. The browser requires a JSON saved=true acknowledgment. Netlify Forms receives a best-effort copy under facade_pairwise_data; its absence or Spam classification does not erase the private original.

Using private researcher credentials in the process environment, not frontend code:

```
node tools/manage-prolific-allocation.mjs --out C:\PRIVATE\prolific-export
```

The output directory must be outside this public repository. Export the original five Forms responses separately. Deduplicate Forms and Blobs copies using participant/submission identity. The export includes raw responses, quality flags and current quota counts; complete quota status is not equivalent to analytical eligibility.

## Deployment verification

Commit and deploy the HTML, run_survey.js, prolific-entry.js, shared allocation modules and new Netlify Function together. Netlify must install the existing @netlify/blobs dependency and build functions. Local file previews and GitHub Pages cannot run the allocator.

Before starting recruitment, verify the deployed index loads prolific-entry.js, a no-ID request to the function returns invalid_prolific_link, and the PREVIEW link runs without a production allocation. Backend concurrency/storage tests run in memory and do not create real participant responses. A real-host end-to-end smoke test requires an explicitly designated technical session and reconciliation of that session; do not fabricate a paid Prolific submission.

Do not change the campaign or manifest during recruitment: doing so creates a new quota namespace instead of continuing these quotas.
