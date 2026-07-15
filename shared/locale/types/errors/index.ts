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
  readonly passwordRequiresUppercase: string;
  readonly passwordRequiresLowercase: string;
  readonly passwordRequiresDigit: string;
  readonly passwordRequiresSpecialChar: string;
  readonly tooManyLoginAttempts: string;
  readonly serviceUnavailable: string;
  readonly invalidCredentials: string;
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
}

/**
 * CreditErrors — credit specific errors.
 */
export interface CreditErrors {
  readonly duplicatePurchase: string;
  readonly insufficientBalance: (params: { studentId: string; remaining: number }) => string;
  readonly invalidInput: string;
}

/**
 * FileErrors — file/storage specific errors.
 */
export interface FileErrors {
  readonly recordNotFound: (params: { tableName: string; entityId: string }) => string;
  readonly invalidFileType: string;
  readonly invoicePaymentProofPending: string;
}

/**
 * ErrorsLabels — the top-level errors namespace.
 * Only the subset needed by the login GraphQL mutation is defined here.
 * Grow this interface as more errors are migrated.
 */
export interface ErrorsLabels {
  readonly auth: AuthErrors;
  readonly permissionManagement: PermissionManagementErrors;
  readonly billing: BillingErrors;
  readonly credit: CreditErrors;
  readonly file: FileErrors;
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
  readonly studentNotFound: (id: string) => string;
  readonly studentCreateFailed: string;
  readonly studentUpdateFailed: (id: string) => string;
  readonly studentVersionMismatch: (params: { id: string; expectedVersion: number; gotVersion: number }) => string;
  readonly insufficientClasses: (params: { id: string; remaining: number; required: number }) => string;
  readonly invalidStatusTransition: (params: { currentStatus: string; newStatus: string }) => string;
  readonly categoryNotFound: (id: string) => string;
  readonly categoryCreateFailed: string;
  readonly unknownName: string;
  readonly meetingProviderInactive: string;
  readonly meetingConfigNotFound: (id: string) => string;
  readonly meetingConfigCreateFailed: string;
  readonly meetingConfigUpdateFailed: string;
  readonly meetingProviderNotFound: (id: string) => string;
  readonly meetingProviderCreateFailed: string;
  readonly meetingProviderUpdateFailed: string;
  readonly meetingProviderInUse: string;
  readonly userNotFound: (id: string) => string;
  readonly cannotModifyBankingFields: string;
  readonly invalidInput: string;
  readonly sessionNotActivated: string;
  readonly teacherNotFound: (id: string) => string;
  readonly staffProfileNotFound: string;
  readonly quotaMustBeNonNegative: string;
  readonly quotaExceedsTotal: (params: { requested: number; total: number }) => string;
  readonly parentNotFound: string;
  readonly studentEmailRequired: string;
  readonly studentPasswordRequired: string;
  readonly userEmailExists: string;
  readonly permissionGroupNotFound: string;
  readonly categoryHasSubjects: string;
  readonly cannotRescheduleToSelf: string;
  readonly cannotRescheduleCompleted: string;
  readonly cannotRescheduleAlreadyRescheduled: string;
  readonly outOfQuota: string;
  readonly leaveQuotaExceeded: (params: { maxLeaves: string }) => string;
  readonly classInstanceNotFound: (params: { id: string }) => string;
  readonly originalClassNotFound: string;
  readonly sessionNotActivated: string;
  readonly invalidTransition: string;
  // ─── Scheduling-specific errors ──────────────────────────────────────
  readonly teacherNotAssigned: (params: { teacherId: string; studentId: string; startTime: string }) => string;
  readonly teacherBooked: string;
  readonly studentBooked: string;
  readonly meetingUrlInUse: string;
}
