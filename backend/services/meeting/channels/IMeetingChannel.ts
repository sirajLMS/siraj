export class MeetingChannelError extends Error {
  readonly code: string;
  readonly upstreamMessage?: string;
  readonly upstreamStatus?: number;
  /** Whether retrying the operation might succeed. `false` for configuration,
   * auth, and permission errors that will never succeed on retry. */
  readonly retryable: boolean;

  constructor(message: string, code: string, upstreamMessage?: string, upstreamStatus?: number, retryable = true) {
    super(message);
    this.name = "MeetingChannelError";
    this.code = code;
    this.upstreamMessage = upstreamMessage;
    this.upstreamStatus = upstreamStatus;
    this.retryable = retryable;
  }
}

export class UnsupportedProviderKindError extends MeetingChannelError {
  constructor(providerKind: string) {
    super(
      `Provider kind "${providerKind}" does not support automatic meeting URL generation.`,
      "UNSUPPORTED_PROVIDER_KIND",
      undefined,
      undefined,
      false
    );
    this.name = "UnsupportedProviderKindError";
  }
}

export class InsufficientScopesError extends MeetingChannelError {
  readonly requiredScopes: readonly string[];
  readonly grantedScopes?: readonly string[];

  constructor(requiredScopes: readonly string[], grantedScopes?: readonly string[], upstreamMessage?: string) {
    super(
      `Insufficient scopes. Required: ${requiredScopes.join(", ")}. Granted: ${grantedScopes?.join(", ") ?? "unknown"}.`,
      "INSUFFICIENT_SCOPES",
      upstreamMessage,
      undefined,
      false
    );
    this.name = "InsufficientScopesError";
    this.requiredScopes = requiredScopes;
    this.grantedScopes = grantedScopes;
  }
}

export class InvalidServiceAccountJsonError extends MeetingChannelError {
  constructor(reason: string) {
    super(
      `Invalid Google service account JSON: ${reason}`,
      "INVALID_SERVICE_ACCOUNT_JSON",
      undefined,
      undefined,
      false
    );
    this.name = "InvalidServiceAccountJsonError";
  }
}

export class MissingImpersonationSubjectError extends MeetingChannelError {
  constructor() {
    super(
      "GOOGLE_MEET_IMPERSONATE_SUBJECT is not configured. Domain-Wide Delegation requires a subject to impersonate.",
      "MISSING_IMPERSONATION_SUBJECT",
      undefined,
      undefined,
      false
    );
    this.name = "MissingImpersonationSubjectError";
  }
}

export class NoOrgCredentialsNoUserTokenError extends MeetingChannelError {
  readonly providerSlug: string;

  constructor(providerSlug: string) {
    super(
      `No org credentials configured for "${providerSlug}" and no per-user OAuth token found. Configure org credentials or connect your account.`,
      "NO_ORG_CREDENTIALS_NO_USER_TOKEN",
      undefined,
      undefined,
      false
    );
    this.name = "NoOrgCredentialsNoUserTokenError";
    this.providerSlug = providerSlug;
  }
}

export class ProviderReauthRequiredError extends MeetingChannelError {
  readonly providerSlug: string;
  readonly userId?: string;

  constructor(providerSlug: string, userId?: string, upstreamMessage?: string) {
    const userSuffix = userId ? ` (user: ${userId})` : "";
    super(
      `Re-authentication required for "${providerSlug}"${userSuffix}. The stored token is expired or revoked.`,
      "PROVIDER_REAUTH_REQUIRED",
      upstreamMessage,
      undefined,
      false
    );
    this.name = "ProviderReauthRequiredError";
    this.providerSlug = providerSlug;
    this.userId = userId;
  }
}

export class RateLimitedError extends MeetingChannelError {
  readonly retryAfterSeconds?: number;

  constructor(providerSlug: string, retryAfterSeconds?: number) {
    const suffix = retryAfterSeconds ? ` Retry after ${retryAfterSeconds}s.` : "";
    super(`Rate limited by "${providerSlug}".${suffix}`, "RATE_LIMITED", undefined, 429);
    this.name = "RateLimitedError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ProviderUnavailableError extends MeetingChannelError {
  constructor(providerSlug: string, upstreamStatus?: number, upstreamMessage?: string) {
    super(`Provider "${providerSlug}" is unavailable.`, "PROVIDER_UNAVAILABLE", upstreamMessage, upstreamStatus);
    this.name = "ProviderUnavailableError";
  }
}

export class NoAppAccessPolicyError extends MeetingChannelError {
  constructor(upstreamMessage?: string) {
    super(
      "No application access policy found for this app. Assign an application access policy to the organizer user via PowerShell.",
      "NO_APP_ACCESS_POLICY",
      upstreamMessage,
      403,
      false
    );
    this.name = "NoAppAccessPolicyError";
  }
}

export class PermissionDeniedError extends MeetingChannelError {
  constructor(upstreamMessage?: string, upstreamStatus?: number) {
    super(
      "Permission denied by provider. This usually indicates a Domain-Wide Delegation (DWD) or service-account configuration issue.",
      "PERMISSION_DENIED",
      upstreamMessage,
      upstreamStatus,
      false
    );
    this.name = "PermissionDeniedError";
  }
}

export class ZoomApiError extends MeetingChannelError {
  readonly zoomCode?: number;

  constructor(message: string, zoomCode?: number, upstreamStatus?: number) {
    super(message, "ZOOM_API_ERROR", message, upstreamStatus);
    this.name = "ZoomApiError";
    this.zoomCode = zoomCode;
  }
}

export class GoogleMeetApiError extends MeetingChannelError {
  readonly googleStatus?: string;

  constructor(message: string, googleStatus?: string, upstreamStatus?: number) {
    super(message, "GOOGLE_MEET_API_ERROR", message, upstreamStatus);
    this.name = "GoogleMeetApiError";
    this.googleStatus = googleStatus;
  }
}

export class MicrosoftTeamsApiError extends MeetingChannelError {
  readonly teamsCode?: string;

  constructor(message: string, teamsCode?: string, upstreamStatus?: number) {
    super(message, "MICROSOFT_TEAMS_API_ERROR", message, upstreamStatus);
    this.name = "MicrosoftTeamsApiError";
    this.teamsCode = teamsCode;
  }
}
