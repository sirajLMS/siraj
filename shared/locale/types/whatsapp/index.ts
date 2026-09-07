/**
 * WhatsApp i18n namespace — compile-time TypeScript schema.
 *
 * This is the SOLE source of truth for WhatsApp configuration UI strings,
 * template status labels, tier captions, opt-in consent copy, and delivery
 * failure messages. Consumed by:
 *  - Server Components via `getTranslations(locale).whatsappTranslations`
 *  - Client Components via `useAppTranslation("whatsapp")`
 *  - Backend services via `getServerTranslations(locale).whatsappTranslations`
 *
 * shared/ cannot import from @/backend/**, so Meta enum values are reproduced
 * as plain string-literal unions and validated by the consuming layer.
 */

/** Meta throughput level values. */
export type WhatsappThroughputLevel = "STANDARD" | "COEXISTENCE" | "HIGH" | "UNKNOWN";

export interface WhatsappLabels {
  // ─── Page / Tab labels ──────────────────────────────────────────────
  readonly pageTitle: string;
  readonly tabNavAriaLabel: string;
  readonly tabNumbers: string;
  readonly tabTemplates: string;
  readonly tabOptIn: string;

  // ─── Numbers tab ─────────────────────────────────────────────────────
  readonly numbersTitle: string;
  readonly numbersSubtitle: string;
  readonly addAccount: string;
  readonly editAccount: string;
  readonly editToken: string;
  readonly editPin: string;
  readonly cancel: string;
  readonly save: string;
  readonly deleteAccount: string;
  readonly deleteConfirm: string;
  readonly wabaId: string;
  readonly phoneNumberId: string;
  readonly displayPhoneNumber: string;
  readonly displayName: string;
  readonly accessToken: string;
  readonly accessTokenPlaceholder: string;
  readonly twoStepPin: string;
  readonly twoStepPinPlaceholder: string;
  readonly isActive: string;
  readonly qualityRating: string;
  readonly messagingTier: string;
  readonly throughputLevel: string;
  readonly lastWebhookAt: string;
  readonly syncFromMeta: string;
  /** Tooltip explaining why sync is disabled: missing env-config keys listed inline. */
  readonly syncFromMetaUnavailable: (missingEnvKeys: string) => string;
  /** Button label while a sync is in progress (button is also disabled then). */
  readonly syncFromMetaBusy: string;
  readonly syncSuccess: string;
  /** Snackbar result after a Meta sync: total numbers synced + how many were newly added. */
  readonly syncSuccessWithCounts: (synced: number, added: number) => string;
  readonly syncNoChange: string;
  readonly syncError: string;
  readonly noAccounts: string;

  // ─── Templates tab ──────────────────────────────────────────────────
  readonly templatesTitle: string;
  readonly templatesSubtitle: string;
  readonly templateName: string;
  readonly templateLanguage: string;
  readonly templateStatus: string;
  readonly templateCategory: string;
  readonly noTemplates: string;
  readonly syncTemplates: string;

  // ─── Template status labels (Q5: Meta enum → localized) ───────────
  readonly templateStatusApproved: string;
  readonly templateStatusPending: string;
  readonly templateStatusRejected: string;
  readonly templateStatusPaused: string;
  readonly templateStatusPendingDeletion: string;
  readonly templateStatusDisabled: string;

  // ─── Quality rating labels (Q5) ────────────────────────────────────
  readonly qualityGreen: string;
  readonly qualityYellow: string;
  readonly qualityRed: string;
  readonly qualityUnknown: string;

  // ─── Tier label captions (Q5: raw Meta enum → localized) ──────────
  readonly tier10: string;
  readonly tier50: string;
  readonly tier250: string;
  readonly tier1K: string;
  readonly tier5K: string;
  readonly tier10K: string;
  readonly tier100K: string;
  readonly tierUnlimited: string;
  readonly tierUnknown: string;

  // ─── Throughput level labels ────────────────────────────────────────
  readonly throughputStandard: string;
  readonly throughputCoexistence: string;
  readonly throughputHigh: string;
  readonly throughputUnknown: string;

  // ─── Coexistence warning (R7) ───────────────────────────────────────
  readonly coexistenceWarningTitle: string;
  readonly coexistenceWarningBody: string;

  // ─── Unverified 2-slot warning (R7) ────────────────────────────────
  readonly unverifiedWarningTitle: string;
  readonly unverifiedWarningBody: string;

  // ─── Tier exceeded & coexistence inline warnings (Task 11) ─────────
  readonly warningTierExceeded: string;
  readonly warningCoexistence: string;

  // ─── Throughput metric label (Task 11) ──────────────────────────────
  readonly throughput24h: string;

  // ─── Opt-in toggle + consent copy (REQ-10) ──────────────────────────
  readonly optInTitle: string;
  readonly optInSubtitle: string;
  readonly optInToggle: string;
  readonly optInConsentBody: string;
  readonly optInEnabled: string;
  readonly optInDisabled: string;

  // ─── Snackbar / notification messages (i18n) ──────────────────────
  readonly deleteSuccess: string;
  readonly deleteError: string;
  readonly saveSuccess: string;
  readonly saveError: string;
  readonly optInError: string;
  readonly isInactive: string;

  // ─── Delivery-failure keys (14.5 — notifications namespace extension) ──
  readonly deliveryFailed: string;
  readonly deliveryFailedWithReason: (reason: string) => string;

  // ─── Create/Edit form labels (Task 1) ──────────────────────────────
  readonly createAccountTitle: string;
  readonly editNameTitle: string;
  readonly displayNameLabel: string;
  readonly phoneNumberIdLabel: string;
  readonly wabaIdLabel: string;
  readonly displayNameHelper: string;
  readonly phoneNumberIdHelper: string;
  readonly wabaIdHelper: string;

  // ─── Validation messages (Task 1) ──────────────────────────────────
  readonly validationDisplayNameRequired: string;
  readonly validationDisplayNameTooLong: string;
  readonly validationPhoneNumberIdRequired: string;
  readonly validationPhoneNumberIdNumeric: string;
  readonly validationWabaIdRequired: string;
  readonly validationWabaIdNumeric: string;
  readonly validationAccessTokenTooShort: string;
  readonly validationPinFormat: string;
  readonly validationPurposeRequired: string;
  readonly validationPurposeInvalid: string;

  // ─── Delete confirm with interpolation (Task 1) ───────────────────
  readonly deleteConfirmTitle: string;
  readonly deleteConfirmMessage: (displayName: string) => string;

  // ─── State labels (Task 1) ─────────────────────────────────────────
  readonly loadingTitle: string;
  readonly retry: string;
  readonly refresh: string;
  readonly permissionDenied: string;

  // ─── Account action labels (Task 1) ────────────────────────────────
  readonly editName: string;
  readonly addFirstNumber: string;

  // ─── Template preview labels (Task 1) ─────────────────────────────
  readonly templateBody: string;
  readonly templateButtons: string;
  readonly templateLastUpdated: string;

  // ─── Error boundary (Task 1) ───────────────────────────────────────
  readonly errorGenericTitle: string;
  readonly errorGeneric: string;

  // ─── Opt-in history table (Task 12) ─────────────────────────────────
  /** Section title for the opt-in audit history table. */
  readonly optInHistoryTitle: string;
  /** Section subtitle for the opt-in audit history table. */
  readonly optInHistorySubtitle: string;
  /** Column header: date of the audit entry. */
  readonly optInHistoryDate: string;
  /** Column header: action (opted in / opted out). */
  readonly optInHistoryAction: string;
  /** Column header: user who changed the opt-in state. */
  readonly optInHistoryChangedBy: string;
  /** Label shown when action is "opted in". */
  readonly optInActionOptedIn: string;
  /** Label shown when action is "opted out". */
  readonly optInActionOptedOut: string;
  /** Empty state message when no audit entries exist. */
  readonly optInHistoryEmpty: string;
  /** Filter button label for date range. */
  readonly optInHistoryFilter: string;
  /** Start date label for the date range filter. */
  readonly optInHistoryFilterFrom: string;
  /** End date label for the date range filter. */
  readonly optInHistoryFilterTo: string;
  /** Apply button in the date range filter popover. */
  readonly optInHistoryFilterApply: string;
  /** Clear button in the date range filter popover. */
  readonly optInHistoryFilterClear: string;
  /** Export button label. */
  readonly optInHistoryExport: string;

  // ─── Admin consolidated opt-in view (Task 13) ──────────────────────
  /** Title for the admin consolidated opt-in view section. */
  readonly optInAdminTitle: string;
  /** Subtitle for the admin consolidated opt-in view section. */
  readonly optInAdminSubtitle: string;
  /** Column header: user name. */
  readonly optInAdminUserName: string;
  /** Column header: opted-in status (Yes/No). */
  readonly optInAdminOptedIn: string;
  /** Column header: opt-in timestamp. */
  readonly optInAdminOptedInAt: string;
  /** Column header: actions column. */
  readonly optInAdminActions: string;
  /** Search field placeholder for filtering by user name. */
  readonly optInAdminSearchPlaceholder: string;
  /** Label for opted-in status (Yes). */
  readonly optInAdminYes: string;
  /** Label for opted-out status (No). */
  readonly optInAdminNo: string;
  /** Empty state message when no users match the search filter. */
  readonly optInAdminEmpty: string;

  // ─── Embedded Signup (coexistence onboarding) — minimal Phase-8 set ──
  /** Header/menu button opening the embedded signup dialog. */
  readonly connectBusinessApp: string;
  readonly embeddedSignupTitle: string;
  readonly embeddedSignupDescription: string;
  readonly embeddedSignupLaunch: string;
  readonly embeddedSignupWaitingTitle: string;
  readonly embeddedSignupWaitingBody: string;
  readonly embeddedSignupCancelledTitle: string;
  readonly embeddedSignupCancelledBody: string;
  readonly embeddedSignupErrorTitle: string;
  readonly embeddedSignupSuccessTitle: string;
  readonly embeddedSignupSuccessBody: string;
  readonly embeddedSignupRetry: string;
  readonly embeddedSignupNotConfigured: string;

  // ─── Embedded Signup stepper & guidance ─────────────────────────────
  /** Stepper step 2 label: pairing continues inside the WhatsApp Business app. */
  readonly embeddedSignupStepCompleteInApp: string;
  /** Stepper step 3 label: contacts/history sync after onboarding. */
  readonly embeddedSignupStepSync: string;
  /** Caption noting the minimum WhatsApp Business app version required. */
  readonly embeddedSignupVersionNote: string;
  /** Info alert: contacts/history sync in the background (up to 24h). */
  readonly embeddedSignupSyncInfo: string;
  /** Body copy for the error panel when the session errors or completion fails. */
  readonly embeddedSignupErrorBody: string;
  /** Title shown while the completion mutation is in flight. */
  readonly embeddedSignupCompletingTitle: string;
  /** Body shown while the completion mutation is in flight. */
  readonly embeddedSignupCompletingBody: string;
  /** Final action shown on the success surface (closes the dialog). */
  readonly embeddedSignupDone: string;
  /** Accessible label for the header close (X) button. */
  readonly embeddedSignupClose: string;
  /** Caption above the allowed-origins deep link on the launch step. */
  readonly embeddedSignupAllowedOriginsTitle: string;
  /** Guidance: register this app's origin as an allowed domain before launching. */
  readonly embeddedSignupAllowedOriginsBody: (origin: string) => string;
  /** Anchor text for the Meta App Dashboard settings deep link (new tab). */
  readonly embeddedSignupAllowedOriginsLink: string;
  /** Notice shown (tooltip/snackbar) when the page is served over plain HTTP — Meta rejects FB.login outside HTTPS. */
  readonly embeddedSignupRequiresHttps: string;

  // ─── Accessibility & Permission Denied (Task 17) ───────────────────
  /** Permission denied UI title. */
  readonly permissionDeniedTitle: string;
  /** Permission denied UI description. */
  readonly permissionDeniedDescription: string;

  // ─── Tab labels (v2: inbox tab) ──────────────────────────────────────
  readonly tabInbox: string;

  // ─── Purpose labels (WhatsappAccountPurpose: GENERAL/ADVERTISING/STUDENTS) ──
  readonly purposeLabel: string;
  readonly purposeHelper: string;
  readonly purposeGeneral: string;
  readonly purposeAdvertising: string;
  readonly purposeStudents: string;
  readonly purposeUpdated: string;
  readonly purposeUpdateFailed: string;

  // ─── Onboarding mode labels (WhatsappOnboardingMode) ──────────────────
  readonly onboardingModeLabel: string;
  readonly onboardingModeCloudApi: string;
  readonly onboardingModeCoexistence: string;
  /** Tooltip shown when a coexistence number has app-side restrictions. */
  readonly coexistenceRestrictionsHint: string;

  // ─── Coexistence sync statuses (WhatsappSyncStatus) ───────────────────
  readonly syncStatusLabel: string;
  readonly syncStatusNotStarted: string;
  readonly syncStatusRequested: string;
  readonly syncStatusSyncing: string;
  readonly syncStatusComplete: string;
  readonly syncStatusFailed: string;
  /** Badge shown when the paired phone declined history sharing. */
  readonly syncHistoryDeclined: string;
  readonly syncProgress: (percent: number) => string;
  /** Streaming panel: current history-sync phase while Meta streams chunks. */
  readonly syncPhaseLabel: (phase: number) => string;
  /** Streaming panel: localized hint for the remaining sync window deadline. */
  readonly syncDeadlineHint: (deadline: string) => string;
  /** Guidance sentence on the failed panel when history sharing was declined. */
  readonly syncDeclinedGuidance: string;

  // ─── Banners & option descriptions (Numbers/Opt-in surfaces) ──────────
  /** Info banner above the numbers list: shared tier, per-number quality. */
  readonly addNumberInfoBanner: string;
  /** Purpose option description: GENERAL. */
  readonly purposeOptionGeneralDescription: string;
  /** Purpose option description: STUDENTS. */
  readonly purposeOptionStudentsDescription: string;
  /** Purpose option description: ADVERTISING. */
  readonly purposeOptionAdvertisingDescription: string;
  /** Opt-in surface banner: WhatsApp notifications default to off. */
  readonly optInDefaultOffBanner: string;
}
