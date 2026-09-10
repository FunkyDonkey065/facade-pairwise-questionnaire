// Release checks confirmed by the researcher; not an independent legal review.
window.STUDY_CONFIG = Object.freeze({
  mode: "production",
  // The first four are real study responses; set the place limit in Prolific.
  prolificInitialTarget: 4,
  prolificInitialBlock: "B01",
  // Confirm the existing study and completion/screen-out codes before release.
  prolificStudyConfirmed: true,
  // Do not allocate new local places in the block reserved for the first four.
  localExcludedBlocks: ["B01"],
  localMode: "production",
  localAutomaticAllocation: true,
  localReleaseWithPendingReviews: false,
  uploadTestHost: "facadeevaluation.netlify.app",
  completionUrl: "https://app.prolific.com/submissions/complete?cc=C1E5N9GT",
  // Paid Custom screening exit, separate from full questionnaire completion.
  screenOutUrl: "https://app.prolific.com/submissions/complete?cc=C5VYN5AN",
  submissionEndpoint: "/",
  collectionPlatform: "netlify_forms",
  // Planning estimate including optional demographics; confirm with participant pilots.
  estimatedMinutes: "10-15",
  retentionPeriod: "approximately 10 years",
  researchContact: "Yanjie Li, yanjie.li@upc.edu",
  protocolSourceDocument: "YanjieLiThesisEthicalCode260119.docx",
  responsibleDepartment: "Department of Architectural Technology (UPC)",
  dataProcessingActivityCode: "F05.4",
  // F05.4 is a processing-activity code, not an ethics approval or exemption.
  ethicsReference: "CEUPC 2026-046",
  ethicsProjectTitle: "Multi-Objective Optimization for Retrofitting School Facades",
  ethicsSourceDocument: "207 CEUPC 22 gener 2026 Dictamen CAT__signed.pdf",
  ethicsCommitteeMeetingDate: "2026-01-22",
  // Date displayed in the PDF signature block; not a cryptographic verification.
  ethicsSignedDate: "2026-01-23",
  geographyVerified: true,
  // 2026-09-10: researcher confirmed no Barcelona training data, image use,
  // and current questionnaire/data-collection coverage in the Ethical_Code materials.
  independentStimuliVerified: true,
  imageUseReviewed: true,
  participantInformationApproved: true,
  // 2026-09-10: local upload-test JSON/CSV verified in Netlify (Spam).
  // This verifies transport only, not ethics approval or human pilot timing.
  collectorPilotVerified: true,
  participantLanguage: "es",
  localRecoveryHours: 24,
  allocation: "fixed_block_quotas"
});
