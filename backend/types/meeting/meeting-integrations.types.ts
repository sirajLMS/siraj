/**
 * Type definitions for the admin "Meeting Integrations" Settings tab.
 *
 * These types describe the shape of data returned by
 * `MeetingIntegrationService` — the service that surfaces per-provider
 * credentials health, connected OAuth accounts, test-connection probes,
 * and token revocation for admins.
 */

import type { JWTPayload as JoseJWTPayload } from "jose";
import type {
  MeetingConnectionTestMode,
  MeetingIntegrationConnectedAccountStatus,
} from "@/backend/enum/meeting/meeting-integrations.enum";
import type { EnvironmentConfig } from "@/backend/lib/env";
import type { MeetingProvider, MeetingProviderKind } from "@/backend/types";

export type { MeetingConnectionTestMode, MeetingIntegrationConnectedAccountStatus };

// ============================================================================
// Provider summary
// ============================================================================

export type MeetingIntegrationProviderReturnType = {
  readonly slug: MeetingProvider;
  readonly kind: MeetingProviderKind;
  readonly credentialsHealthy: boolean;
  readonly lastTestedAt: Date | null;
  readonly connectedTeacherCount: number;
  readonly reauthNeededCount: number;
  readonly endpoints: readonly string[];
};

// ============================================================================
// Connected account
// ============================================================================

export type MeetingIntegrationConnectedAccountReturnType = {
  readonly userId: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly connectedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly lastRefreshedAt: Date | null;
  readonly status: MeetingIntegrationConnectedAccountStatus;
  readonly scopes?: readonly string[];
};

// ============================================================================
// Test connection
// ============================================================================

export type TestMeetingConnectionReturnType = {
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly mode: MeetingConnectionTestMode;
  readonly testJoinUrl: string | null;
  readonly deleted: boolean | null;
  readonly upstreamResponseSummary: string;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly rawUpstreamPayload: Record<string, unknown> | null;
  readonly requiredScopes: readonly string[] | null;
  readonly grantedScopes: readonly string[] | null;
};

// ============================================================================
// Revoke token
// ============================================================================

export type AdminRevokeTokenReturnType = {
  readonly userId: string;
  readonly providerSlug: MeetingProvider;
  readonly revoked: boolean;
};

// ============================================================================
// Service input types
// ============================================================================

export type TestMeetingConnectionSubmitInput = {
  readonly providerSlug: MeetingProvider;
  readonly mode: MeetingConnectionTestMode;
};

export type AdminRevokeTokenSubmitInput = {
  readonly userId: string;
  readonly providerSlug: MeetingProvider;
};

// ============================================================================
// Connect / disconnect per-user OAuth
// ============================================================================

export type ConnectMeetingProviderOAuthSubmitInput = {
  readonly providerSlug: MeetingProvider;
  readonly returnPath: string;
};

export type ConnectMeetingProviderOAuthReturnType = {
  readonly authorizeUrl: string;
  readonly state: string;
};

export type DisconnectMeetingProviderOAuthSubmitInput = {
  readonly providerSlug: MeetingProvider;
};

export type DisconnectMeetingProviderOAuthReturnType = {
  readonly ok: boolean;
  readonly providerSlug: MeetingProvider;
};

// ============================================================================
// Self-service connected provider summary (for profile page)
// ============================================================================

export type MyConnectedMeetingProviderReturnType = {
  readonly providerSlug: MeetingProvider;
  readonly email: string | null;
  readonly connectedAt: Date | null;
  readonly expiresAt: Date | null;
};

// ============================================================================
// Per-user OAuth token refresh
// ============================================================================

/**
 * Result of exchanging a stored refresh token for a new access token.
 */
export interface RefreshedToken {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresAt: Date;
}

// ============================================================================
// Per-user OAuth state JWT + callback types
// ============================================================================

/**
 * Payload of the signed state JWT minted by `MeetingOAuthService.connectProviderOAuth`.
 * Carries `userId`, `providerSlug`, `returnPath`, a random `nonce`, and the
 * `sessionId` of the browser session that initiated the flow (H1 fix: binds
 * the signed state to the caller's session so a stolen state cannot be
 * replayed from a different browser).
 */
export interface MeetingOAuthStatePayload extends JoseJWTPayload {
  userId: string;
  providerSlug: MeetingProvider;
  returnPath: string;
  nonce: string;
  sessionId: string;
}

/**
 * Minimal token-response shape every meeting provider returns from its
 * token endpoint during the code-for-tokens exchange.
 */
export interface OAuthTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in: number;
  readonly refresh_token?: string;
  readonly scope?: string;
}

/**
 * Provider-specific callback configuration for the shared OAuth callback handler.
 *
 * Each route file constructs one of these and passes it to
 * `MeetingOAuthService.exchangeAndPersistTokens`.
 */
export interface OAuthCallbackConfig {
  /** Canonical meeting-provider slug. */
  readonly providerSlug: MeetingProvider;
  /** Human-readable provider name used in log messages (e.g. "Zoom"). */
  readonly displayName: string;
  /**
   * Builds the absolute token-endpoint URL for the code-for-tokens exchange.
   * Receives the resolved environment config so MS Teams can read its
   * tenant id, etc.
   */
  readonly buildTokenUrl: (config: EnvironmentConfig) => string;
  /** Returns the OAuth client id for this provider from env config. */
  readonly resolveClientId: (config: EnvironmentConfig) => string;
  /** Returns the OAuth client secret for this provider from env config. */
  readonly resolveClientSecret: (config: EnvironmentConfig) => string;
  /**
   * Optional extra form params to merge into the token-exchange body
   * (e.g. MS Teams sends `scope`). The base params (`grant_type`, `code`,
   * `redirect_uri`, `client_id`, `client_secret`) are always included.
   */
  readonly extraTokenParams?: Record<string, string>;
}
