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

  // ─── Functions (were {param} strings) ──────────────────────────────
  readonly demoGroupNotFound: (groupSlug: string) => string;
  readonly demoGroupNoUser: (groupSlug: string) => string;
}

/**
 * ErrorsLabels — the top-level errors namespace.
 * Only the subset needed by the login GraphQL mutation is defined here.
 * Grow this interface as more errors are migrated.
 */
export interface ErrorsLabels {
  readonly auth: AuthErrors;
  // ─── Top-level API-facing strings ──────────────────────────────────
  readonly rateLimitExceeded: string;
  readonly duplicateRequest: string;
  readonly internalServerError: string;
}
