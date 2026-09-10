// Technical upload testing only. Production still requires every research review below.
window.STUDY_CONFIG = Object.freeze({
  mode: "upload_test",
  uploadTestHost: "facadeevaluation.netlify.app",
  completionUrl: "",
  submissionEndpoint: "/",
  collectionPlatform: "netlify_forms",
  estimatedMinutes: "8-12",
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
  independentStimuliVerified: false,
  imageUseReviewed: false,
  // The letter requires review of time/content extensions; current scope is not yet reconciled.
  participantInformationApproved: false,
  collectorPilotVerified: false,
  participantLanguage: "es",
  localRecoveryHours: 24,
  allocation: "fixed_block_quotas"
});
