/**
 * AuthErrors — the auth sub-namespace of the errors translations.
 *
 * All fields that used {param} placeholders in the old next-intl system
 * are now typed as functions. Fields with no params remain plain strings.
 */
export interface AuthErrors {
  // ─── No-param strings ──────────────────────────────────────────────
  readonly invalidRoleTab: string;
  readonly passwordMinLength: string;
  readonly passwordWeakComplexity: string;
  readonly passwordRequiresUppercase: string;
  readonly passwordRequiresLowercase: string;
  readonly passwordRequiresDigit: string;
  readonly passwordRequiresSpecialChar: string;
  readonly tooManyLoginAttempts: string;
  readonly serviceUnavailable: string;
  readonly invalidCredentials: string;
  readonly currentPasswordInvalid: string;
  readonly passwordsDoNotMatch: string;
  readonly accountDeactivated: string;
  readonly accountLocked: string;
  readonly demoLoginNotEnabled: string;
  readonly demoLoginFailed: string;
  readonly impersonationNotAllowed: string;
  readonly cannotImpersonateSelf: string;
  readonly cannotImpersonateSuperAdmin: string;
  readonly impersonationTargetNotFound: string;
  readonly impersonationTargetInactive: string;
  readonly impersonationSessionInvalid: string;
  readonly impersonationNotActive: string;
  readonly impersonationExpired: string;
  readonly impersonationNotAllowedDuringSession: string;
  readonly groupSimulationNotAllowed: string;
  readonly groupSimulationSessionInvalid: string;
  readonly groupSimulationNotActive: string;
  readonly groupSimulationNotAllowedDuringSession: string;
  readonly groupSimulationNotAllowedWhileImpersonating: string;
  readonly groupSimulationAlreadyHasGroup: string;
  readonly insufficientPermissions: string;
  readonly impersonationNotAllowedWhileImpersonating: string;
  readonly cannotResetOwnPasswordViaAdmin: string;

  // ─── Functions (were {param} strings) ──────────────────────────────
  readonly demoGroupNotFound: (groupSlug: string) => string;
  readonly demoGroupNoUser: (groupSlug: string) => string;
}

/**
 * PermissionManagementErrors — permission management specific errors.
 */
export interface PermissionManagementErrors {
  readonly unauthorized: string;
  readonly userNotFound: (id: string) => string;
  readonly permissionGroupNotFound: (id: string) => string;
  readonly permissionGroupNameRequired: string;
  readonly permissionGroupNameTooLong: string;
  readonly permissionGroupInvalidName: string;
  readonly cannotModifySuperAdmin: string;
  readonly cannotModifySelf: string;
  readonly cannotModifySystemPermissionGroup: string;
  readonly cannotDeleteSystemPermissionGroup: string;
}

/**
 * BillingErrors — billing specific errors.
 */
export interface BillingErrors {
  readonly invoiceNotFound: (id: string) => string;
  readonly invoiceNotPendingReview: (id: string) => string;
  readonly invoicePaymentProofNotFound: (id: string) => string;
  readonly invoiceAlreadyPaid: (params: { id: string; status: string }) => string;
  readonly paymentProofRequired: string;
  readonly cannotDeletePaidInvoice: (id: string) => string;
  readonly invalidParentId: string;
  readonly invalidInvoiceAmount: string;
  readonly parentNotFound: string;
  readonly invoiceVersionMismatch: (params: { id: string; expectedVersion: number; gotVersion: number }) => string;
  readonly exchangeRateStale: (params: { fromCurrency: string; toCurrency: string }) => string;
  readonly quotaReleaseReservationFailed: string;
  readonly quotaReleaseConcurrentModification: string;
  readonly quotaRefreshConcurrentWrite: string;
  readonly quotaResetConcurrentModification: string;
  readonly paymentMethodCreateFailed: string;
  readonly paymentMethodNotFound: (id: string) => string;
  readonly currencyHedgeCreateFailed: string;
  readonly fxRefreshRateLimitExceeded: string;
}

/**
 * CreditErrors — credit specific errors.
 */
export interface CreditErrors {
  readonly duplicatePurchase: string;
  readonly insufficientBalance: (params: { studentId: string; remaining: number }) => string;
  /** Hour-ledger variant of insufficientBalance (credit-hours module). */
  readonly insufficientHours: (params: { studentId: string; remaining: number; required: number }) => string;
  readonly invalidInput: string;
}

/**
 * PackageErrors — package plan catalog errors (credit-hours module).
 */
export interface PackageErrors {
  readonly codenameAlreadyExists: (codename: string) => string;
  readonly invalidInput: string;
  readonly planArchived: (id: string) => string;
}

/**
 * FileErrors — file/storage specific errors.
 */
export interface FileErrors {
  readonly recordNotFound: (params: { tableName: string; entityId: string }) => string;
  readonly invalidFileType: string;
  readonly invalidFileId: string;
  readonly invoicePaymentProofPending: string;
  readonly fileUsageRegistered: string;
  readonly fileUsageRegisterFailed: (error: string) => string;
  readonly fileUsageRegisterFailedGeneric: string;
  readonly fileCurrentlyInUse: string;
  readonly unableToCheckFileUsage: string;
  readonly directoryNotFound: string;
  readonly directoryPermissionsUpdated: string;
  readonly directoryPermissionsUpdateFailed: string;
  readonly permissionsUpdateFailed: (error: string) => string;
  readonly permissionsUpdateFailedGeneric: string;
  readonly fileProtectionUpdated: string;
  readonly fileProtectionUpdateFailed: string;
  readonly directoryProtectionUpdated: string;
  readonly directoryProtectionUpdateFailed: string;
  readonly fileOrDirectoryNotFound: string;
  readonly protectionUpdateFailed: (error: string) => string;
  readonly protectionUpdateFailedGeneric: string;
  readonly sha256HashMismatch: string;
  readonly invalidUploadRequestBody: string;
  readonly invalidUploadSession: string;
  readonly uploadSessionAlreadyUsed: string;
  readonly uploadSessionExpired: string;
  readonly filePathMismatch: string;
  readonly forbidden: string;
  readonly uploadsNotAllowedInDirectory: string;
  readonly invalidFilePath: string;
  readonly fileSizeExceedsMaximum: (maxSizeMb: number) => string;
  readonly contentTypeRequired: string;
  readonly contentTypeMismatch: (expected: string) => string;
  readonly contentLengthRequired: string;
  readonly contentLengthExceedsSize: (size: string) => string;
  readonly contentMd5Required: string;
  readonly contentMd5Mismatch: string;
  readonly failedToCreateFileRecord: string;
  readonly invalidOrExpiredToken: string;
  readonly requestBodyRequired: string;
  readonly failedToWriteFile: string;
  readonly filePathRequired: string;
  readonly fileNotFound: string;
  readonly authenticationRequired: string;
  readonly missingPathname: string;
  readonly missingUploadSessionId: string;
  readonly invalidFileSize: string;
  readonly missingContentType: string;
  readonly fileDeletedSuccessfully: string;
  readonly failedToDeleteFile: (error: string) => string;
  readonly itemProtectedFromDeletion: string;
  readonly fileProtectedFromDeletion: string;
  readonly deletionNotAllowedInParentDirectory: string;
  readonly deletionNotAllowedInParentDirectoryWithPath: (path: string) => string;
  readonly fileDeletionNotAllowedInDirectory: string;
  readonly sourcePathNotFound: string;
  readonly uploadsNotAllowedToDestination: string;
  readonly allItemsProcessedSuccessfully: (operationName: string) => string;
  readonly itemsProcessedWithFailures: (successCount: number, failureCount: number, operationName: string) => string;
  readonly creatingSubdirectoriesNotAllowed: string;
  readonly folderCreatedSuccessfully: string;
  readonly failedToCreateFolder: (error: string) => string;
  readonly fileUploadedSuccessfully: string;
  readonly failedToUploadFile: (error: string) => string;
  readonly moveNotAllowedFromDirectory: (sourceDir: string) => string;
  readonly fileRenamedSuccessfully: string;
  readonly failedToRenameFile: (error: string) => string;
  readonly fileIsInUse: string;
  readonly itemNotFound: (path: string) => string;
  readonly itemNotFoundInBucket: string;
  readonly directoryDoesNotExist: string;
  readonly unknownError: string;
  readonly failedToRetrieveMovedItemInfo: string;
}

/**
 * MeetingProviderErrors — meeting provider specific errors.
 */
export interface MeetingProviderErrors {
  readonly meetingProviderInactive: string;
  readonly meetingConfigNotFound: (id: string) => string;
  readonly meetingConfigCreateFailed: string;
  readonly meetingConfigUpdateFailed: string;
  readonly meetingProviderNotFound: (id: string) => string;
  readonly meetingProviderCreateFailed: string;
  readonly meetingProviderUpdateFailed: string;
  readonly meetingProviderInUse: string;
  readonly invalidReturnPath: string;
  readonly missingSubject: string;
  readonly dwdNotEnabled: string;
  readonly slugIsRequired: string;
  readonly urlAllowlistIsRequired: string;
  readonly fieldSchemaIsRequired: string;
  readonly providerIdIsRequired: string;
  readonly isDefaultIsRequired: string;
  readonly detailsIsRequired: string;
  readonly channelRateLimited: string;
  readonly channelPermissionDenied: string;
  readonly channelProviderUnavailable: string;
  readonly channelProviderReauthRequired: string;
  readonly channelUnsupportedProviderKind: string;
  readonly channelInsufficientScopes: string;
  readonly channelInvalidServiceAccountJson: string;
  readonly channelMissingImpersonationSubject: string;
  readonly channelNoOrgCredentialsNoUserToken: string;
  readonly channelNoAppAccessPolicy: string;
  readonly channelProviderErrorOccurred: string;
}

/**
 * ParentErrors — parent specific errors.
 * Flat-key lookups (e.g. `t("parent.alreadyExists")`) reach the nested members
 * via the dotted key path resolved by the backend translation loader.
 */
export interface ParentErrors {
  readonly alreadyExists: string;
  readonly invalidTimezone: string;
  readonly createFailed: string;
  readonly suggestionSubmitFailed: string;
  readonly upsertFailed: string;
}

/**
 * ComplaintErrors — complaint specific errors.
 */
export interface ComplaintErrors {
  readonly responseCreateFailed: string;
  readonly createFailed: string;
}

/**
 * SubjectResourceErrors — subject-resource attachment errors.
 */
export interface SubjectResourceErrors {
  readonly attachFailed: string;
  readonly linkNotFound: string;
  readonly notFound: string;
}

/**
 * ClassSubjectErrors — class subject repository errors.
 */
export interface ClassSubjectErrors {
  readonly createFailed: string;
}

/**
 * LeaveQuotaErrors — leave quota usage repository errors.
 */
export interface LeaveQuotaErrors {
  readonly updateFailed: string;
  readonly insertFailed: string;
}

/**
 * ClassInstanceErrors — class instance upsert errors.
 */
export interface ClassInstanceErrors {
  readonly idempotencyKeyRequired: string;
}

/**
 * MeetingConfigErrors — class meeting config validation errors.
 */
export interface MeetingConfigErrors {
  readonly requiresInstanceOrSchedule: string;
}

/**
 * MeetingTokenErrors — meeting provider token storage errors.
 */
export interface MeetingTokenErrors {
  readonly providerTokenUpdateFailed: string;
  readonly providerTokenInsertFailed: string;
}

/**
 * SessionRepositoryErrors — session lifecycle validation errors.
 */
export interface SessionRepositoryErrors {
  readonly userIdRequired: string;
}

/**
 * StaffErrors — staff profile specific errors.
 * Flat-key lookups (e.g. `t("staff.alreadyExists")`) reach the nested members
 * via the dotted key path resolved by the backend translation loader.
 */
export interface StaffErrors {
  readonly alreadyExists: string;
}

/**
 * LessonReportErrors — lesson report specific errors.
 */
export interface LessonReportErrors {
  readonly notEligibleForReview: string;
  readonly alreadyExists: string;
  readonly createFailed: string;
  readonly notFound: string;
  readonly alreadyReviewed: string;
}

/**
 * ResourceErrors — learning resource specific errors.
 */
export interface ResourceErrors {
  readonly bookDeleteFailed: string;
  readonly resourceDeleteFailed: string;
  readonly permissionDenied: string;
  readonly seedCreateFailed: string;
  readonly createFailed: string;
  readonly handbookUploadFailed: string;
}

/**
 * TeacherErrors — teacher specific errors.
 */
export interface TeacherErrors {
  readonly alreadyExists: string;
  readonly teacherNotFound: (id: string) => string;
  readonly staffProfileNotFound: string;
  readonly quotaMustBeNonNegative: string;
  readonly quotaExceedsTotal: (params: { requested: number; total: number }) => string;
  readonly vacationRequestNotFound: (id: string) => string;
  readonly createFailed: string;
  readonly upsertFailed: string;
  readonly noteCreateFailed: string;
  readonly staffProfileCreateFailed: string;
  readonly staffProfileUpdateFailed: string;
  readonly availabilityUpdateFailed: string;
  readonly availabilityInsertFailed: string;
  readonly recurringUnavailabilityInsertFailed: string;
  readonly vacationInsertFailed: string;
}

/**
 * TeacherDueErrors — teacher due validation errors.
 */
export interface TeacherDueErrors {
  readonly hoursMustBePositive: string;
  readonly amountMustBeNonNegative: string;
  readonly insertFailed: string;
}

/**
 * PayrollErrors — teacher payroll calculation and override errors.
 */
export interface PayrollErrors {
  readonly notTerminal: string;
  readonly alreadyPaid: string;
  readonly awaitingSettlement: string;
  readonly invalidTargetStatus: string;
  readonly partialRequiresPercentage: string;
}

/**
 * CarryoverErrors — carryover balance settlement errors: bulk aggregation of
 * audited sessions, conversion of unpaid carryovers into expenses, and the
 * correction (unpay) flow.
 */
export interface CarryoverErrors {
  readonly notFound: (id: string) => string;
  readonly noInstances: string;
  readonly sessionNotAudited: string;
  readonly sessionAlreadyLinked: string;
  readonly fxRateMissing: string;
  readonly paymentDateRequired: string;
  readonly expenseDateInvalid: string;
  readonly noCarryovers: string;
  readonly alreadyPaid: string;
  readonly notPaid: string;
  readonly paidCannotDelete: string;
  readonly paidCannotEdit: string;
  readonly teacherImmutable: string;
  readonly toExpenseFailed: string;
}

/**
 * ExpenseErrors — expense ledger errors: manual entry validation, salary
 * provenance guards (carryover-linked rows), and soft-delete corrections.
 */
export interface ExpenseErrors {
  readonly notFound: string;
  readonly alreadyDeleted: string;
  readonly deleteViaUnpay: string;
  readonly typeImmutableForSalaries: string;
  readonly valueImmutableForSalaries: string;
  readonly salariesViaCarryoverOnly: string;
  readonly titleRequired: string;
  readonly valueRequired: string;
  readonly valueInvalid: string;
  readonly valueNegative: string;
  readonly currencyRequired: string;
  readonly paymentDateInvalid: string;
  readonly expenseDateInvalid: string;
  readonly createFailed: string;
}

/**
 * StudentErrors — student specific errors.
 */
export interface StudentErrors {
  readonly studentNotFound: (id: string) => string;
  readonly studentCreateFailed: string;
  readonly studentUpdateFailed: (id: string) => string;
  readonly studentVersionMismatch: (params: { id: string; expectedVersion: number; gotVersion: number }) => string;
  readonly insufficientClasses: (params: { id: string; remaining: number; required: number }) => string;
  readonly invalidStatusTransition: (params: { currentStatus: string; newStatus: string }) => string;
  readonly studentEmailRequired: string;
  readonly studentPasswordRequired: string;
  readonly upsertFailed: string;
}

/**
 * CategoryErrors — category specific errors.
 */
export interface CategoryErrors {
  readonly categoryNotFound: (id: string) => string;
  readonly categoryCreateFailed: string;
  readonly categoryHasSubjects: string;
}

/**
 * UserErrors — user specific errors.
 */
export interface UserErrors {
  readonly userNotFound: (id: string) => string;
  readonly userEmailExists: string;
  readonly cannotModifyBankingFields: string;
  readonly parentNotFound: string;
  readonly userCreateFailed: (email: string) => string;
}

/**
 * SchedulingSharedErrors — properties shared between the SchedulingErrors
 * sub-interface and the flattened top-level ErrorsLabels. Extracted to avoid
 * within-file type-signature duplication.
 */
interface SchedulingSharedErrors {
  readonly leaveQuotaExceeded: (params: { maxLeaves: string }) => string;
  readonly classInstanceNotFound: (params: { id: string }) => string;
  readonly originalClassNotFound: string;
  readonly invalidTransition: string;
  readonly teacherNotAssigned: (params: { teacherId: string; studentId: string; startTime: string }) => string;
  readonly teacherBooked: string;
  readonly studentBooked: string;
  readonly meetingUrlInUse: string;
  readonly sessionNotActivated: string;
  readonly absentTooEarly: (params: { waitingMinutes: string }) => string;
  readonly recurringClassDaysRequired: () => string;
  readonly invalidDuration: () => string;
  readonly subjectRequired: () => string;
}

/**
 * SchedulingErrors — scheduling specific errors.
 */
export interface SchedulingErrors extends SchedulingSharedErrors {
  readonly cannotRescheduleToSelf: string;
  readonly cannotRescheduleCompleted: string;
  readonly cannotRescheduleAlreadyRescheduled: string;
  readonly outOfQuota: string;
  readonly missedClassTime: string;
  readonly vacationStartBeforeEnd: string;
  readonly startTimeBeforeEndTime: string;
  readonly dateRangeExceedsMax: (maxDays: number) => string;
  readonly vacationRequestNotPending: (id: string) => string;
  readonly vacationRequestAlreadyCancelled: (id: string) => string;
}

/**
 * PermissionGroupErrors — permission group specific errors.
 */
export interface PermissionGroupErrors {
  readonly permissionGroupNotFound: string;
}

/**
 * SessionConfigErrors — session configuration validation errors.
 */
export interface SessionConfigErrors {
  readonly roleNameRequired: string;
  readonly ttlOutOfRange: string;
  readonly maxConcurrentOutOfRange: string;
}

/**
 * QuotaErrors — quota system errors (nested under `errors.quota`).
 */
export interface QuotaErrors {
  readonly insufficientRemaining: (requested: number, available: number) => string;
  readonly exceedsCreditBalance: (requested: number, available: number) => string;
  readonly periodicRefreshFailed: (quotaName: string, reason: string) => string;
  readonly invalidPeriod: (quotaName: string) => string;
  readonly alreadyExpired: (quotaName: string) => string;
  readonly earmarkExceedsRemaining: (requested: number, available: number) => string;
  readonly slotConflict: (startTime: string, endTime: string) => string;
  readonly onDemandNoCredits: (studentName: string) => string;
  readonly cannotRefreshNonPeriodic: string;
  readonly noValidPeriodDays: string;
}

/**
 * NotificationErrors — notification delivery specific errors.
 */
export interface NotificationErrors {
  readonly deliveryNotFound: (id: string) => string;
}

/**
 * FxErrors — FX (exchange rate) specific errors.
 */
export interface FxErrors {
  readonly syncAlreadyRunning: string;
  readonly syncFailed: string;
}

/**
 * AppearanceErrors — site appearance (branding) mutation errors.
 *
 * Surfaced when `saveAppearanceDraft`, `publishAppearance`, or
 * `resetAppearanceDraft` GraphQL mutations fail, or when the caller lacks the
 * `SETTINGS_APPEARANCE_MANAGE` permission (AC-7, AC-24).
 */
export interface AppearanceErrors {
  readonly saveDraftFailed: string;
  readonly publishFailed: string;
  readonly resetFailed: string;
  readonly unauthorized: string;
}

/**
 * ServiceOutageErrors — full-screen error page copy for the root error
 * boundary (`app/error.tsx`). The database-unavailable variant is selected by
 * the `DATABASE_UNAVAILABLE` error digest; everything else uses the generic
 * copy. Neither variant ever exposes underlying error details.
 */
export interface ServiceOutageErrors {
  readonly title: string;
  readonly description: string;
  readonly autoRetryHint: string;
  readonly genericTitle: string;
  readonly genericDescription: string;
  readonly retry: string;
  readonly retrying: string;
}

/**
 * ErrorsLabels — the top-level errors namespace.
 * Only the subset needed by the login GraphQL mutation is defined here.
 * Grow this interface as more errors are migrated.
 */
export interface ErrorsLabels
  extends StudentErrors,
    CategoryErrors,
    UserErrors,
    PermissionGroupErrors,
    SchedulingSharedErrors {
  readonly auth: AuthErrors;
  readonly permissionManagement: PermissionManagementErrors;
  readonly billing: BillingErrors;
  readonly credit: CreditErrors;
  readonly package: PackageErrors;
  readonly file: FileErrors;
  readonly meetingProvider: MeetingProviderErrors;
  readonly teacher: TeacherErrors;
  readonly teacherDue: TeacherDueErrors;
  readonly payroll: PayrollErrors;
  readonly carryover: CarryoverErrors;
  readonly expenses: ExpenseErrors;
  readonly student: StudentErrors;
  readonly category: CategoryErrors;
  readonly user: UserErrors;
  readonly scheduling: SchedulingErrors;
  readonly permissionGroup: PermissionGroupErrors;
  readonly sessionConfig: SessionConfigErrors;
  readonly quota: QuotaErrors;
  readonly parent: ParentErrors;
  readonly staff: StaffErrors;
  readonly lessonReport: LessonReportErrors;
  readonly resource: ResourceErrors;
  readonly notification: NotificationErrors;
  readonly fx: FxErrors;
  readonly complaint: ComplaintErrors;
  readonly subjectResource: SubjectResourceErrors;
  readonly meetingConfig: MeetingConfigErrors;
  readonly meeting: MeetingTokenErrors;
  readonly session: SessionRepositoryErrors;
  readonly classSubject: ClassSubjectErrors;
  readonly leaveQuota: LeaveQuotaErrors;
  readonly classInstance: ClassInstanceErrors;
  readonly appearance: AppearanceErrors;
  readonly serviceOutage: ServiceOutageErrors;
  // ─── Top-level API-facing strings ──────────────────────────────────
  readonly rateLimitExceeded: string;
  readonly duplicateRequest: string;
  readonly internalServerError: string;
  readonly insufficientPermissions: string;
  readonly unauthorized: string;
  readonly unauthorizedAction: string;
  readonly unauthorizedViewList: string;
  readonly unauthorizedSearch: string;
  readonly unauthorizedViewMetrics: string;
  readonly notFound: string;
  readonly unknownName: string;
  readonly invalidInput: string;
  /** Generic over-long free-text rejection (max-length guardrails). */
  readonly tooLong: string;
  readonly invalidNationalId: string;

  // ─── General user creation errors ──────────────────────────────────
  readonly specializedGroupNotAllowed: string;

  // ─── Lesson Report errors ─────────────────────────────────────────
  readonly rejectedReportsRequireReason: string;
  readonly approvedReportsNoRejectionReason: string;

  // ─── FX Display Currency messages (used by buildFxDisplayMessages) ────
  readonly displayCurrencyNotSet: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  readonly displayCurrencyStale: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  readonly displayCurrencyMixed: (values: { lockedAmount: string; lockedCurrency: string }) => string;

  // ─── Flattened error properties for backward compatibility ───────────
  // Sub-interface properties are inherited via `extends` (StudentErrors,
  // CategoryErrors, UserErrors, PermissionGroupErrors, SchedulingSharedErrors).
  // Only properties NOT covered by sub-interfaces are declared here.
  readonly meetingProviderNotFound: (id: string) => string;
  readonly meetingProviderCreateFailed: string;
  readonly meetingProviderUpdateFailed: string;
  readonly meetingProviderInUse: string;
  readonly meetingProviderInactive: string;
  readonly meetingConfigNotFound: (id: string) => string;
  readonly meetingConfigCreateFailed: string;
  readonly meetingConfigUpdateFailed: string;
  readonly teacherNotFound: (id: string) => string;
  readonly staffProfileNotFound: string;
  readonly quotaMustBeNonNegative: string;
  readonly quotaExceedsTotal: (params: { requested: number; total: number }) => string;
  readonly parentAlreadyDeactivated: string;
  readonly parentAlreadyActivated: string;
  readonly cannotRescheduleToSelf: string;
  readonly cannotRescheduleCompleted: string;
  readonly cannotRescheduleAlreadyRescheduled: string;
  readonly outOfQuota: string;
  readonly quotaExpired: string;
  readonly quotaNotFound: string;
  readonly invalidQuotaState: string;
  readonly exchangeRateStale: (params: { fromCurrency: string; toCurrency: string }) => string;
  readonly outsideAvailability: string;
  readonly teacherUnavailabilityConflict: string;
  readonly teacherOnVacation: string;
  readonly resourceNotFound: string;
  readonly currencyInUse: string;

  // ─── Cron errors ──────────────────────────────────────────────────
  readonly invalidRunStatus: (status: string, runId: string) => string;

  // ─── Communication / suggestion / complaint errors ─────────────────────
  readonly complaintNotFound: string;
  readonly suggestionNotFound: string;
  readonly complaintTooManyFiles: (maxFiles: number) => string;
  readonly complaintFileTooLarge: (maxSizeMb: number) => string;
  readonly suggestionCannotMarkSelfAsDuplicate: string;
  readonly suggestionCircularDuplicate: string;
  readonly suggestionTargetIsAlreadyDuplicate: string;

  // ─── Communication dispatch errors ──────────────────────────────────────
  readonly unknownCommunicationChannel: (channel: string) => string;
  readonly unknownError: string;
  readonly unknownDispatchError: string;
  readonly whatsappTemplateMissing: string;
  readonly whatsappNoSenderForPurpose: string;

  // ─── WhatsApp account management errors ─────────────────────────────────
  readonly whatsappAccountNotFound: (id: string) => string;
  readonly whatsappAccessTokenNotConfigured: string;
  readonly whatsappWabaIdNotConfigured: string;
  readonly whatsappEmbeddedSignupFailed: string;
  readonly whatsappPurposeRequiresActive: string;
  readonly whatsappAccountOffboarded: string;
  readonly whatsappCoexistenceTakenByOtherPartner: string;
  readonly whatsappSyncDeadlineExpired: string;
  readonly whatsappHistoryDeclined: string;
  readonly whatsappWebhookProcessingFailed: string;
  readonly whatsappPhoneNumberIdNotConfigured: string;
  readonly whatsappConnectionTestSucceeded: string;
  readonly whatsappConnectionTestFailed: string;

  // ─── Delivery failure messages ───────────────────────────────────────────
  readonly emailChannelLabel: string;
  readonly smsChannelLabel: string;
  readonly pushChannelLabel: string;
  readonly whatsappChannelLabel: string;
  readonly onAppChannelLabel: string;
  readonly deliveryFailed: (channelLabel: string) => string;

  // Quota errors accessible via quota.* — see QuotaErrors

  // ─── Offline resolver / notification fallbacks ──────────────────────
  readonly studentNameFallback: string;

  // ─── Data-integrity guards (developer-facing) ────────────────────
  readonly invalidIdentifierKind: (value: string) => string;
  readonly invalidSupportedDirections: (value: string) => string;

  // ─── Permission override validation errors ──────────────────────
  readonly invalidOverrideState: string;

  // ─── Storage bulk operation errors ──────────────────────────────
  readonly bulkOperationLimitExceeded: (operation: string, limit: number) => string;

  // ─── API route errors ─────────────────────────────────────────────
  readonly forbidden: string;
  readonly noPdfAvailable: string;
  readonly invoiceNotFoundShort: string;
  readonly invalidLocale: string;
  readonly invalidOrigin: string;
  readonly failedToSetLocale: string;
  readonly fxRefreshFailed: string;
  readonly deletedExpiredSignedUrls: (count: number) => string;
  readonly invalidRequestFormat: string;
  readonly missingRequiredFields: string;
  readonly invalidSessionId: string;
  readonly failedToWriteLogs: string;
  readonly missingCodeOrState: string;
  readonly invalidOrExpiredOAuthState: string;
  readonly providerMismatch: string;
  readonly failedToCompleteOAuthTokenExchange: string;
  readonly invalidEventType: string;
}
