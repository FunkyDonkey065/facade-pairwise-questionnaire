# Demographics v3

All three entries ask the same nine optional questions after image ratings:
age band, gender identity, completed education, broad design background,
current/most recent work field, relevant education status, relevant professional
experience, main country lived in during ages 0-18, and Barcelona residence duration. No employer, exact birth date or
professional registration number is requested. These are not eligibility filters.

The growing_up_country field stores a two-letter country/territory code, or
multiple_countries, not_listed, prefer_not_to_answer, not_answered, or not_collected.
Older records remain not_collected and are not imputed as Spain. This is neither
birth country nor nationality, and must not be used as a direct proxy for culture.
Avoid publishing small country-by-age-by-profession cells. Keep v2 and v3 identifiable.

Age is grouped, not an exact age. Gender is self-reported gender identity, not
Prolific's Sex variable. Age and education now come directly from the questionnaire;
older responses may still depend on Prolific exports. Missing new fields remain
unknown; never infer them as no expertise. Raw fields and demographics_version are
retained. The number of trials and image tasks is unchanged.

Participant export includes a provisional descriptive expertise_group:

- trained_practitioner: completed relevant qualification and at least one year
  of relevant professional experience, with consistent broad background answers.
- related_background: students, other relevant training, shorter experience or
  experience without a completed relevant qualification.
- general_public: explicitly no relevant training or experience and no reported
  architecture/planning/landscape job.
- unknown: missing, declined or older incomplete background fields.
- needs_review: inconsistent answers; not automatic rejection or exclusion.

This rule is an operational choice, not a validated universal definition of
expertise and not credential verification. Confirm and document the definition
before examining group outcome differences. Report all group counts, missing and
inconsistent cases, and the denominator used for any expert proportion. Preserve
related-background participants rather than merging them silently into laypeople.
Use participant_key to join this table to preference records and raw PAD ratings.
Account for repeated ratings per participant and per image/pair; do not treat
all ratings as independent observations. Four initial participants cannot by
themselves support reliable expert-versus-public conclusions. Consider recruitment
source, batch and demographic-version differences when pooling data.
