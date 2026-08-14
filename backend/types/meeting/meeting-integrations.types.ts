/**
 * Type definitions for the admin "Meeting Integrations" Settings tab.
 *
 * These types describe the shape of data returned by
 * `MeetingIntegrationService` — the service that surfaces per-provider
 * credentials health, connected OAuth accounts, test-connection probes,
 * and token revocation for admins.
 */

import {
  MeetingConnectionTestMode,
  MeetingIntegrationConnectedAccountStatus,
} from "@/backend/enum/meeting/meeting-integrations.enum";
import type { MeetingProvider } from "@/backend/services";
import type { MeetingProviderKind } from "@/backend/types";

export { MeetingConnectionTestMode, MeetingIntegrationConnectedAccountStatus };

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
