import type { ErrorsLabels } from "@/shared/locale/types/errors";

const student = {
  studentNotFound: (id: string) => `Student not found: ${id}`,
  studentCreateFailed: "Failed to create student.",
  studentUpdateFailed: (id: string) => `Failed to update student (id: ${id}).`,
  studentVersionMismatch: ({
    id,
    expectedVersion,
    gotVersion,
  }: {
    id: string;
    expectedVersion: number;
    gotVersion: number;
  }) => `Student ${id} version mismatch: expected ${expectedVersion}, got ${gotVersion}.`,
  insufficientClasses: ({ id, remaining, required }: { id: string; remaining: number; required: number }) =>
    `Insufficient class balance for student ${id}: remaining ${remaining}, required ${required}.`,
  invalidStatusTransition: ({ currentStatus, newStatus }: { currentStatus: string; newStatus: string }) =>
    `Invalid status transition: ${currentStatus} -> ${newStatus}.`,
  studentEmailRequired: "Student email is required.",
  studentPasswordRequired: "Student password is required.",
} as const;

const category = {
  categoryNotFound: (id: string) => `Category not found: ${id}`,
  categoryCreateFailed: "Failed to create class category.",
  categoryHasSubjects: "Cannot delete category because it has associated subjects.",
} as const;

const user = {
  userNotFound: (id: string) => `User not found: ${id}`,
  userEmailExists: "User with this email already exists.",
  cannotModifyBankingFields: "Cannot modify banking fields.",
  parentNotFound: "Parent not found.",
} as const;

const scheduling = {
  cannotRescheduleToSelf: "Cannot reschedule to self.",
  cannotRescheduleCompleted: "Cannot reschedule a completed session.",
  cannotRescheduleAlreadyRescheduled: "Cannot reschedule a session that has already been rescheduled.",
  outOfQuota: "Out of quota.",
  leaveQuotaExceeded: ({ maxLeaves }: { maxLeaves: string }) =>
    `Leave quota exceeded: maximum ${maxLeaves} leaves allowed.`,
  classInstanceNotFound: ({ id }: { id: string }) => `Class instance not found: ${id}`,
  originalClassNotFound: "Original class not found.",
  invalidTransition: "Invalid transition.",
  teacherNotAssigned: ({
    teacherId,
    studentId,
    startTime,
  }: {
    teacherId: string;
    studentId: string;
    startTime: string;
  }) => `Teacher ${teacherId} is not assigned to student ${studentId} at ${startTime}.`,
  teacherBooked: "Teacher is already booked at this time.",
  studentBooked: "Student is already booked at this time.",
  meetingUrlInUse: "Meeting URL is already in use.",
  sessionNotActivated: "Session is not activated.",
  missedClassTime: "You have missed the class time.",
} as const;

const permissionGroup = {
  permissionGroupNotFound: "Permission group not found.",
} as const;

const teacher = {
  alreadyExists: "Teacher profile for this user already exists.",
  teacherNotFound: (id: string) => `Teacher not found: ${id}`,
  staffProfileNotFound: "Staff profile not found.",
  quotaMustBeNonNegative: "Quota must be a non-negative number.",
  quotaExceedsTotal: ({ requested, total }: { requested: number; total: number }) =>
    `Quota (${requested}) exceeds total (${total}).`,
} as const;

export const errorsEn: ErrorsLabels = {
  auth: {
    // ─── No-param strings ────────────────────────────────────────────
    invalidRoleTab: "The selected role tab is invalid.",
    passwordMinLength: "Password must be at least 8 characters long.",
    passwordRequiresUppercase: "Password must contain at least one uppercase letter.",
    passwordRequiresLowercase: "Password must contain at least one lowercase letter.",
    passwordRequiresDigit: "Password must contain at least one digit.",
    passwordRequiresSpecialChar: "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:',.<>?/).",
    tooManyLoginAttempts: "Too many login attempts. Please try again later.",
    serviceUnavailable: "Authentication service temporarily unavailable",
    invalidCredentials: "Invalid email or password",
    currentPasswordInvalid: "Current password is incorrect.",
    passwordsDoNotMatch: "New password and confirmation password do not match.",
    accountDeactivated: "This account has been deactivated. Please contact support.",
    accountLocked: "Too many login attempts. Your account has been temporarily locked.",
    demoLoginNotEnabled: "Demo login is not enabled",
    demoLoginFailed: "Demo login failed",
    impersonationNotAllowed: "You are not allowed to impersonate users",
    cannotImpersonateSelf: "You cannot impersonate yourself",
    cannotImpersonateSuperAdmin: "You cannot impersonate another super administrator",
    impersonationTargetNotFound: "The user to impersonate was not found",
    impersonationTargetInactive: "The user to impersonate is inactive or deleted",
    impersonationSessionInvalid: "Your session is invalid for impersonation",
    impersonationNotActive: "No active impersonation session",
    impersonationExpired: "The impersonation session has expired",
    impersonationNotAllowedDuringSession: "This action is not allowed while impersonating a user",
    groupSimulationNotAllowed: "You are not allowed to simulate permission groups",
    groupSimulationSessionInvalid: "Your session is invalid for permission group simulation",
    groupSimulationNotActive: "No active permission group simulation",
    groupSimulationNotAllowedDuringSession: "This action is not allowed while simulating a permission group",
    groupSimulationNotAllowedWhileImpersonating: "End impersonation before simulating a permission group",
    groupSimulationAlreadyHasGroup: "You already have this permission group; choose a different group to simulate",
    insufficientPermissions: "You do not have sufficient permissions to perform this action.",
    impersonationNotAllowedWhileImpersonating: "You cannot impersonate while already impersonating another user.",
    cannotResetOwnPasswordViaAdmin: "You cannot reset your own password via the admin path.",
    // ─── Functions (were {param} strings) ────────────────────────────
    demoGroupNotFound: (groupSlug: string) => `Demo group not found: ${groupSlug}`,
    demoGroupNoUser: (groupSlug: string) => `No user found for demo group: ${groupSlug}`,
  },
  permissionManagement: {
    unauthorized: "You do not have sufficient permissions to perform this action.",
    userNotFound: (id: string) => `User not found: ${id}`,
    permissionGroupNotFound: (id: string) => `Permission group not found: ${id}`,
    permissionGroupNameRequired: "Permission group name is required.",
    permissionGroupNameTooLong: "Permission group name is too long (max 255 characters).",
    permissionGroupInvalidName: "Invalid permission group name.",
    cannotModifySuperAdmin: "Cannot modify super admin user.",
    cannotModifySystemPermissionGroup: "Cannot modify core properties of system permission groups",
    cannotDeleteSystemPermissionGroup: "Cannot delete a system permission or group",
  },
  billing: {
    invoiceNotFound: (id: string) => `Invoice not found: ${id}`,
    invoiceNotPendingReview: (id: string) => `Invoice is not pending review: ${id}`,
    invoicePaymentProofNotFound: (id: string) => `Payment proof not found for invoice: ${id}`,
    invoiceAlreadyPaid: ({ id, status }: { id: string; status: string }) =>
      `Invoice ${id} is already ${status.toLowerCase()}.`,
    paymentProofRequired: "Payment proof is required.",
    cannotDeletePaidInvoice: (id: string) => `Cannot delete invoice ${id} because it has been paid.`,
    invalidParentId: "Invalid parent ID.",
    invalidInvoiceAmount: "Invalid invoice amount.",
    parentNotFound: "Parent not found.",
    invoiceVersionMismatch: ({
      id,
      expectedVersion,
      gotVersion,
    }: {
      id: string;
      expectedVersion: number;
      gotVersion: number;
    }) => `Invoice ${id} version mismatch: expected ${expectedVersion}, got ${gotVersion}.`,
    exchangeRateStale: ({ fromCurrency, toCurrency }: { fromCurrency: string; toCurrency: string }) =>
      `Exchange rate for ${fromCurrency} to ${toCurrency} is stale (older than 24 hours)`,
  },
  credit: {
    duplicatePurchase: "This credit purchase has already been processed.",
    insufficientBalance: ({ studentId, remaining }: { studentId: string; remaining: number }) =>
      `Insufficient balance for student ${studentId}. Remaining: ${remaining}`,
    invalidInput: "Invalid input.",
  },
  file: {
    recordNotFound: ({ tableName, entityId }: { tableName: string; entityId: string }) =>
      `${tableName} not found: ${entityId}`,
    invalidFileType: "Invalid file type. Only PDF, JPG, PNG, and HEIC files are allowed.",
    invoicePaymentProofPending: "A payment proof is already pending review for this invoice.",
  },
  meetingProvider: {
    meetingProviderInactive: "Meeting provider is inactive.",
    meetingConfigNotFound: (id: string) => `Meeting config not found: ${id}`,
    meetingConfigCreateFailed: "Failed to create meeting config.",
    meetingConfigUpdateFailed: "Failed to update meeting config.",
    meetingProviderNotFound: (id: string) => `Meeting provider not found: ${id}`,
    meetingProviderCreateFailed: "Failed to create meeting provider.",
    meetingProviderUpdateFailed: "Failed to update meeting provider.",
    meetingProviderInUse: "Meeting provider is in use and cannot be deleted.",
    invalidReturnPath: "Invalid return path. The return path must be a relative URL.",
    missingSubject: "Impersonation subject is required for domain-wide delegation",
    dwdNotEnabled:
      "Domain-Wide Delegation is not enabled for this service account. Contact your Google Workspace admin.",
  },
  parent: {
    alreadyExists: "Parent profile for this user already exists.",
    invalidTimezone: "Invalid timezone.",
    createFailed: "Failed to create parent profile.",
  },
  staff: {
    alreadyExists: "Staff profile for this user already exists.",
  },
  teacher,
  student,
  category,
  user,
  scheduling,
  permissionGroup,
  sessionConfig: {
    roleNameRequired: "Role name is required.",
    ttlOutOfRange: "TTL must be between 60 and 2,419,200 seconds.",
    maxConcurrentOutOfRange: "Max concurrent sessions must be between 1 and 50.",
  },
  quota: {
    insufficientRemaining: (requested: number, available: number) =>
      `Only ${available} quota remaining — requested ${requested}`,
    exceedsCreditBalance: (requested: number, available: number) =>
      `Insufficient credit balance. Available: ${available}, needed: ${requested}`,
    periodicRefreshFailed: (quotaName: string, reason: string) =>
      `Failed to refresh periodic quota ${quotaName}: ${reason}`,
    invalidPeriod: (quotaName: string) => `Quota ${quotaName} has expired or its period is invalid`,
    alreadyExpired: (quotaName: string) => `Quota ${quotaName} has already expired`,
    earmarkExceedsRemaining: (requested: number, available: number) =>
      `Earmark of ${requested} exceeds remaining quota (${available})`,
    slotConflict: (startTime: string, endTime: string) =>
      `Time slot ${startTime}–${endTime} conflicts with existing booking`,
    onDemandNoCredits: (studentName: string) => `Not enough credits for on-demand booking for ${studentName}`,
  },
  // ─── Top-level API-facing strings ──────────────────────────────────
  rateLimitExceeded: "Too many requests. Please try again later.",
  duplicateRequest: "Duplicate request detected. This operation has already been processed.",
  internalServerError: "An unexpected error occurred. Please try again later.",
  insufficientPermissions: "You do not have sufficient permissions to perform this action.",
  unauthorized: "You must be logged in first.",
  unauthorizedAction: "You are not authorized to perform this action.",
  unauthorizedViewList: "You are not authorized to view this list.",
  unauthorizedSearch: "You are not authorized to search.",
  unauthorizedViewMetrics: "You are not authorized to view metrics.",
  notFound: "The requested resource was not found.",
  unknownName: "Unknown",
  invalidInput: "Invalid input.",
  invalidNationalId: "The national ID is invalid for the selected nationality.",

  // ─── Lesson Report errors ─────────────────────────────────────────
  rejectedReportsRequireReason: "REJECTED reports must include a rejection reason.",
  approvedReportsNoRejectionReason: "APPROVED reports must not include a rejection reason.",

  // ─── FX Display Currency messages (used by buildFxDisplayMessages) ────
  displayCurrencyNotSet: (values: { lockedAmount: string; lockedCurrency: string }) =>
    `Display currency not set. Amount locked: ${values.lockedAmount} ${values.lockedCurrency}`,
  displayCurrencyStale: (values: { lockedAmount: string; lockedCurrency: string }) =>
    `Display currency is stale. Amount locked: ${values.lockedAmount} ${values.lockedCurrency}`,
  displayCurrencyMixed: (values: { lockedAmount: string; lockedCurrency: string }) =>
    `Mixed display currencies detected. Amount locked: ${values.lockedAmount} ${values.lockedCurrency}`,

  // ─── Flattened error properties for backward compatibility ───────────
  // Spread the nested sub-objects to provide flat top-level keys
  // (avoids re-declaring ~30 identical properties).
  ...student,
  ...category,
  ...user,
  ...scheduling,
  ...permissionGroup,
  ...teacher,
  meetingProviderNotFound: (id: string) => `Meeting provider not found: ${id}`,
  meetingProviderCreateFailed: "Failed to create meeting provider.",
  meetingProviderUpdateFailed: "Failed to update meeting provider.",
  meetingProviderInUse: "Meeting provider is in use and cannot be deleted.",
  meetingProviderInactive: "Meeting provider is inactive.",
  meetingConfigNotFound: (id: string) => `Meeting config not found: ${id}`,
  meetingConfigCreateFailed: "Failed to create meeting config.",
  meetingConfigUpdateFailed: "Failed to update meeting config.",
  parentAlreadyDeactivated: "Parent account is already deactivated.",
  parentAlreadyActivated: "Parent account is already activated.",
  exchangeRateStale: ({ fromCurrency, toCurrency }: { fromCurrency: string; toCurrency: string }) =>
    `Exchange rate for ${fromCurrency} to ${toCurrency} is stale (older than 24 hours)`,
  quotaExpired: "Quota has expired.",
  quotaNotFound: "Quota not found.",
  invalidQuotaState: "Invalid quota state.",
  outsideAvailability: "Booking is outside teacher availability windows.",
  teacherUnavailabilityConflict: "Booking blocked by recurring unavailability pattern.",
  teacherOnVacation: "Booking blocked by approved vacation period.",
  resourceNotFound: "Learning resource not found.",
  currencyInUse:
    "This currency cannot be deactivated because it is currently in use by invoices, payments, exchange rates, or user profiles.",

  // ─── Cron errors ──────────────────────────────────────────────────
  invalidRunStatus: (status: string, runId: string) => `Cannot retry a run with status ${status} (runId: ${runId}).`,

  // ─── Communication / suggestion / complaint errors ─────────────────────
  complaintNotFound: "Complaint not found.",
  suggestionNotFound: "Suggestion not found.",
  complaintTooManyFiles: (maxFiles: number) => `You can upload a maximum of ${maxFiles} files per complaint.`,
  complaintFileTooLarge: (maxSizeMb: number) => `File size must not exceed ${maxSizeMb} MB.`,
  suggestionCannotMarkSelfAsDuplicate: "A suggestion cannot be marked as a duplicate of itself.",
  suggestionCircularDuplicate: "Cannot create a circular duplicate chain.",
  suggestionTargetIsAlreadyDuplicate: "The target suggestion is already marked as a duplicate of another suggestion.",

  // ─── Communication dispatch errors ──────────────────────────────────────
  unknownCommunicationChannel: (channel: string) => `Unknown communication channel: ${channel}`,
  unknownError: "An unknown error occurred.",
  unknownDispatchError: "An unknown dispatch error occurred.",
  whatsappTemplateMissing: "WhatsApp template configuration is missing for this notification.",

  // ─── WhatsApp account management errors ─────────────────────────────────
  whatsappAccountNotFound: (id: string) => `WhatsApp account not found: ${id}`,
  whatsappAccessTokenNotConfigured: "WhatsApp access token is not configured.",
  whatsappWabaIdNotConfigured: "WhatsApp Business Account ID is not configured.",

  // ─── Delivery failure messages ───────────────────────────────────────────
  emailChannelLabel: "Email",
  smsChannelLabel: "SMS",
  pushChannelLabel: "Push notification",
  whatsappChannelLabel: "WhatsApp",
  onAppChannelLabel: "In-app",
  deliveryFailed: (channelLabel: string) => `${channelLabel} delivery failed. Please try again later.`,

  // Quota errors accessible via quota.* — see QuotaErrors

  // ─── Offline resolver / notification fallbacks ──────────────────────
  studentNameFallback: "Student",
};
