import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export const whatsappEn: WhatsappLabels = {
  // ─── Page / Tab labels ──────────────────────────────────────────────
  pageTitle: "WhatsApp Configuration",
  tabNavAriaLabel: "WhatsApp settings sections",
  tabNumbers: "Numbers",
  tabTemplates: "Templates",
  tabOptIn: "Opt-in",

  // ─── Numbers tab ─────────────────────────────────────────────────────
  numbersTitle: "WhatsApp Numbers",
  numbersSubtitle: "Manage WhatsApp Business Cloud API numbers and credentials.",
  addAccount: "Add Number",
  editAccount: "Edit Number",
  editToken: "Edit Token",
  editPin: "Edit PIN",
  cancel: "Cancel",
  save: "Save",
  deleteAccount: "Delete Number",
  deleteConfirm: "Are you sure you want to delete this WhatsApp number? This action cannot be undone.",
  wabaId: "WABA ID",
  phoneNumberId: "Phone Number ID",
  displayPhoneNumber: "Display Phone Number",
  displayName: "Display Name",
  accessToken: "Access Token",
  accessTokenPlaceholder: "Enter Meta access token",
  twoStepPin: "Two-Step Verification PIN",
  twoStepPinPlaceholder: "Enter 6-digit PIN",
  isActive: "Active",
  qualityRating: "Quality Rating",
  messagingTier: "Messaging Limit Tier",
  throughputLevel: "Throughput Level",
  lastWebhookAt: "Last Webhook Received",
  syncFromMeta: "Sync from Meta",
  syncFromMetaUnavailable: (missingEnvKeys: string) =>
    `Sync from Meta is unavailable: missing WhatsApp configuration (${missingEnvKeys}). Set these values in the environment, or add a WhatsApp account below.`,
  syncFromMetaBusy: "Syncing from Meta…",
  syncSuccess: "Successfully synced WhatsApp accounts from Meta.",
  syncSuccessWithCounts: (synced: number, added: number) => {
    const syncedPhrase = synced === 1 ? "1 number" : `${synced} numbers`;
    if (added === 0) {
      return `Synced ${syncedPhrase} from Meta — all are already known here, nothing new was added.`;
    }
    const addedPhrase = added === 1 ? "1 new number was" : `${added} new numbers were`;
    return `Synced ${syncedPhrase} from Meta — ${addedPhrase} added.`;
  },
  syncNoChange: "No changes detected from Meta.",
  syncError: "Failed to sync from Meta. Please check credentials and try again.",
  noAccounts: 'No WhatsApp numbers configured. Click "Add Number" to get started.',

  // ─── Templates tab ──────────────────────────────────────────────────
  templatesTitle: "Message Templates",
  templatesSubtitle: "Sync and review WhatsApp message templates from Meta.",
  templateName: "Template Name",
  templateLanguage: "Language",
  templateStatus: "Status",
  templateCategory: "Category",
  noTemplates: 'No templates found. Click "Sync Templates" to fetch from Meta.',
  syncTemplates: "Sync Templates",

  // ─── Template status labels (Q5: Meta enum → localized) ───────────
  templateStatusApproved: "Approved",
  templateStatusPending: "Pending",
  templateStatusRejected: "Rejected",
  templateStatusPaused: "Paused",
  templateStatusPendingDeletion: "Pending Deletion",
  templateStatusDisabled: "Disabled",

  // ─── Quality rating labels (Q5) ────────────────────────────────────
  qualityGreen: "High Quality",
  qualityYellow: "Medium Quality",
  qualityRed: "Low Quality",
  qualityUnknown: "Unknown",

  // ─── Tier label captions (Q5: raw Meta enum → localized) ──────────
  tier10: "10 conversations / 24h",
  tier50: "50 conversations / 24h",
  tier250: "250 conversations / 24h",
  tier1K: "1,000 conversations / 24h",
  tier5K: "5,000 conversations / 24h",
  tier10K: "10,000 conversations / 24h",
  tier100K: "100,000 conversations / 24h",
  tierUnlimited: "Unlimited conversations / 24h",
  tierUnknown: "Unknown tier",

  // ─── Throughput level labels ────────────────────────────────────────
  throughputStandard: "Standard",
  throughputCoexistence: "Coexistence",
  throughputHigh: "High",
  throughputUnknown: "Unknown",

  // ─── Coexistence warning (R7) ───────────────────────────────────────
  coexistenceWarningTitle: "Coexistence Mode Active",
  coexistenceWarningBody:
    "This number is in coexistence mode with the WhatsApp Business App. Messaging is limited to 20 messages per second. Some features may be unavailable.",

  // ─── Unverified 2-slot warning (R7) ────────────────────────────────
  unverifiedWarningTitle: "Unverified Number",
  unverifiedWarningBody:
    "This number is unverified and limited to 2 message template slots. Complete Meta verification to unlock full template capacity.",

  // ─── Tier exceeded & coexistence inline warnings (Task 11) ─────────
  warningTierExceeded: "Tier limit exceeded — messaging may be throttled",
  warningCoexistence: "Coexistence mode active — 20 messages/second max",

  // ─── Throughput metric label (Task 11) ──────────────────────────────
  throughput24h: "Throughput (24h)",

  // ─── Opt-in toggle + consent copy (REQ-10) ──────────────────────────
  optInTitle: "WhatsApp Notifications Opt-in",
  optInSubtitle: "Choose whether to receive notifications via WhatsApp.",
  optInToggle: "Receive notifications via WhatsApp",
  optInConsentBody:
    "By enabling this option, you consent to receive notifications and updates via WhatsApp. You may opt out at any time. Standard message rates may apply.",
  optInEnabled: "WhatsApp notifications enabled",
  optInDisabled: "WhatsApp notifications disabled",

  // ─── Snackbar / notification messages ──────────────────────────────
  deleteSuccess: "WhatsApp number deleted successfully.",
  deleteError: "Failed to delete WhatsApp number.",
  saveSuccess: "WhatsApp number saved successfully.",
  saveError: "Failed to save WhatsApp number.",
  optInError: "Failed to update WhatsApp opt-in preference.",
  isInactive: "Inactive",

  // ─── Delivery-failure keys (14.5) ──────────────────────────────────
  deliveryFailed: "WhatsApp message delivery failed",
  deliveryFailedWithReason: (reason: string) => `WhatsApp message delivery failed: ${reason}`,

  // ─── Create/Edit form labels (Task 1) ──────────────────────────────
  createAccountTitle: "Add WhatsApp Number",
  editNameTitle: "Edit Display Name",
  displayNameLabel: "Display Name",
  phoneNumberIdLabel: "Phone Number ID",
  wabaIdLabel: "WABA ID",
  displayNameHelper: "The name shown to recipients in WhatsApp.",
  phoneNumberIdHelper: "The Meta-assigned phone number ID.",
  wabaIdHelper: "The WhatsApp Business Account ID from Meta.",

  // ─── Validation messages (Task 1) ──────────────────────────────────
  validationDisplayNameRequired: "Display name is required.",
  validationDisplayNameTooLong: "Display name must be 100 characters or fewer.",
  validationPhoneNumberIdRequired: "Phone number ID is required.",
  validationPhoneNumberIdNumeric: "Phone number ID must be numeric.",
  validationWabaIdRequired: "WABA ID is required.",
  validationWabaIdNumeric: "WABA ID must be numeric.",
  validationAccessTokenTooShort: "Access token must be at least 50 characters.",
  validationPinFormat: "PIN must be exactly 6 digits.",
  validationPurposeRequired: "Please select a purpose for this number.",
  validationPurposeInvalid: "The selected purpose is not valid.",

  // ─── Delete confirm with interpolation (Task 1) ───────────────────
  deleteConfirmTitle: "Delete WhatsApp Number",
  deleteConfirmMessage: (displayName: string) =>
    `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,

  // ─── State labels (Task 1) ─────────────────────────────────────────
  loadingTitle: "Loading…",
  retry: "Retry",
  refresh: "Refresh",
  permissionDenied: "Permission Denied",

  // ─── Account action labels (Task 1) ────────────────────────────────
  editName: "Edit Name",
  addFirstNumber: "Add Your First Number",

  // ─── Template preview labels (Task 1) ─────────────────────────────
  templateBody: "Message Body",
  templateButtons: "Buttons",
  templateLastUpdated: "Last Updated",

  // ─── Error boundary (Task 1) ───────────────────────────────────────
  errorGenericTitle: "Something went wrong",
  errorGeneric: "An unexpected error occurred while loading WhatsApp settings. Please try again.",

  // ─── Opt-in history table (Task 12) ─────────────────────────────────
  optInHistoryTitle: "Opt-in History",
  optInHistorySubtitle: "Recent changes to your WhatsApp notification opt-in status.",
  optInHistoryDate: "Date",
  optInHistoryAction: "Action",
  optInHistoryChangedBy: "Changed By",
  optInActionOptedIn: "Opted In",
  optInActionOptedOut: "Opted Out",
  optInHistoryEmpty: "No opt-in history entries yet.",
  optInHistoryFilter: "Filter",
  optInHistoryFilterFrom: "From",
  optInHistoryFilterTo: "To",
  optInHistoryFilterApply: "Apply",
  optInHistoryFilterClear: "Clear",
  optInHistoryExport: "Export CSV",

  // ─── Admin consolidated opt-in view (Task 13) ──────────────────────
  optInAdminTitle: "All Users Opt-in Status",
  optInAdminSubtitle: "View and manage opt-in states for all WhatsApp users.",
  optInAdminUserName: "User",
  optInAdminOptedIn: "Opted In",
  optInAdminOptedInAt: "Opted-in At",
  optInAdminActions: "Actions",
  optInAdminSearchPlaceholder: "Search by user name…",
  optInAdminYes: "Yes",
  optInAdminNo: "No",
  optInAdminEmpty: "No users match the search filter.",

  // ─── Embedded Signup (coexistence onboarding) ───────────────────────
  connectBusinessApp: "Connect Business App",
  embeddedSignupTitle: "Connect WhatsApp Business App (Coexistence)",
  embeddedSignupDescription:
    "Connect a number already used in the WhatsApp Business app. Your team keeps using the phone app while the platform can read and send messages.",
  embeddedSignupLaunch: "Launch Meta Embedded Signup",
  embeddedSignupWaitingTitle: "Complete the steps in the Meta window",
  embeddedSignupWaitingBody:
    "Approve the connection in the Meta window (or in the WhatsApp Business app), then come back here. We'll finish setup automatically.",
  embeddedSignupCancelledTitle: "Connection cancelled",
  embeddedSignupCancelledBody:
    "You left the Meta setup before finishing. Nothing was changed — you can start again whenever you're ready.",
  embeddedSignupErrorTitle: "Connection failed",
  embeddedSignupSuccessTitle: "Number connected",
  embeddedSignupSuccessBody:
    "The number is connected. Contacts and chat history sync in the background — this can take up to 24 hours.",
  embeddedSignupRetry: "Try again",
  embeddedSignupNotConfigured: "Embedded signup is not configured for this environment.",
  embeddedSignupStepCompleteInApp: "Complete in the WhatsApp Business app",
  embeddedSignupStepSync: "Sync contacts & history",
  embeddedSignupVersionNote: "Requires WhatsApp Business app 2.24.17 or newer on the staff phone.",
  embeddedSignupSyncInfo:
    "Chat history and contacts sync in the background after connecting — this can take up to 24 hours. Your team keeps using the phone app in the meantime.",
  embeddedSignupErrorBody:
    "The connection could not be completed. No number was connected — you can restart the onboarding flow.",
  embeddedSignupCompletingTitle: "Finishing setup",
  embeddedSignupCompletingBody:
    "Confirming the connection and queueing the contacts and history sync. This only takes a moment.",
  embeddedSignupDone: "Done",
  embeddedSignupClose: "Close",
  embeddedSignupAllowedOriginsTitle: "First-time setup: allow this app in Meta",
  embeddedSignupAllowedOriginsBody: origin =>
    `Meta only returns the signup code to registered origins. Before launching, add ${origin} under App Dashboard → Facebook Login for Business → Settings → Allowed domains and Valid OAuth redirect URIs.`,
  embeddedSignupAllowedOriginsLink: "Open Meta app settings",
  embeddedSignupRequiresHttps:
    "Connecting a number requires a secure HTTPS connection — Meta blocks the login flow on plain HTTP. Open this page over HTTPS to continue.",

  // ─── Accessibility & Permission Denied (Task 17) ───────────────────
  permissionDeniedTitle: "Access Restricted",
  permissionDeniedDescription:
    "You don't have permission to access this section. Contact an administrator if you believe this is an error.",

  // ─── Tab labels (v2) ─────────────────────────────────────────────────
  tabInbox: "Inbox",

  // ─── Purpose labels ───────────────────────────────────────────────────
  purposeLabel: "Purpose",
  purposeHelper: "Chooses which notifications this number sends. Unassigned events fall back to the General number.",
  purposeGeneral: "General",
  purposeAdvertising: "Advertising",
  purposeStudents: "Students",
  purposeUpdated: "Number purpose updated.",
  purposeUpdateFailed: "Failed to update number purpose.",

  // ─── Onboarding mode labels ───────────────────────────────────────────
  onboardingModeLabel: "Onboarding Mode",
  onboardingModeCloudApi: "Cloud API",
  onboardingModeCoexistence: "Coexistence (Business App)",
  coexistenceRestrictionsHint:
    "Coexistence numbers have some limits — broadcast lists and some app-only features stay in the WhatsApp Business app.",

  // ─── Coexistence sync statuses ────────────────────────────────────────
  syncStatusLabel: "Sync Status",
  syncStatusNotStarted: "Not Started",
  syncStatusRequested: "Requested",
  syncStatusSyncing: "Syncing",
  syncStatusComplete: "Complete",
  syncStatusFailed: "Failed",
  syncHistoryDeclined: "History Declined",
  syncProgress: (percent: number) => `${percent}% synced`,
  syncPhaseLabel: (phase: number) => `History sync — Phase ${phase}`,
  syncDeadlineHint: (deadline: string) => `Expected by ${deadline}`,
  syncDeclinedGuidance: "Inbox stays unavailable for this number until onboarding is re-run.",

  // ─── Banners & option descriptions ────────────────────────────────────
  addNumberInfoBanner: "Each number shares your portfolio messaging limit; quality is measured per number.",
  purposeOptionGeneralDescription: "Fallback for all notifications",
  purposeOptionStudentsDescription: "Class reminders and reports",
  purposeOptionAdvertisingDescription: "Ad campaign replies",
  optInDefaultOffBanner: "WhatsApp notifications are off by default; users opt in explicitly.",
};
