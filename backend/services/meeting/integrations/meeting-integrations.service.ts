/**
 * Admin "Meeting Integrations" service.
 *
 * Surfaces per-provider credential health, connected OAuth token accounts,
 * live Test Connection probes, and token revocation for administrators with
 * `SETTINGS_EDIT_MEETING_INTEGRATIONS` permission.
 *
 * Pattern mirrors `environment-config.service.ts` (namespace of async functions,
 * audit log via `AuditService.createManyAuditLogs`, typed service error).
 */

import { MeetingProviderTokenRepository } from "@/backend/db/repo/meeting/meeting-provider-token.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { AppPermission } from "@/backend/enum";
import {
  MeetingConnectionTestMode,
  MeetingIntegrationConnectedAccountStatus,
} from "@/backend/enum/meeting/meeting-integrations.enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { GoogleMeetAdapter } from "@/backend/services/meeting/channels/google-meet/GoogleMeetAdapter";
import {
  type IMeetingChannel,
  InsufficientScopesError,
  MeetingChannelError,
  type MeetingProvider,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import { getMeetingChannel } from "@/backend/services/meeting/channels/MeetingChannelFactory";
import { MicrosoftTeamsAdapter } from "@/backend/services/meeting/channels/microsoft-teams/MicrosoftTeamsAdapter";
import { ZoomMeetingAdapter } from "@/backend/services/meeting/channels/zoom/ZoomMeetingAdapter";
import { AuditService } from "@/backend/services/system/audit.service";
import type { CreateAuditLogInput } from "@/backend/types";
import type {
  AdminRevokeTokenReturnType,
  AdminRevokeTokenSubmitInput,
  MeetingIntegrationConnectedAccountReturnType,
  MeetingIntegrationProviderReturnType,
  TestMeetingConnectionReturnType,
  TestMeetingConnectionSubmitInput,
} from "@/backend/types/meeting/meeting-integrations.types";
import type { MeetingProviderKind } from "@/backend/types/meeting/meeting-provider.types";
import type { ErrorsLabels } from "@/shared/locale";

// ============================================================================
// Constants
// ============================================================================

const AUTO_GEN_SLUGS: readonly MeetingProvider[] = ["zoom", "google_meet", "microsoft_teams"];

/** Window before token expiry considered "expiring soon" (7 days). */
const EXPIRING_SOON_MS = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// Permission assertion
// ============================================================================

async function assertCanEditMeetingIntegrations(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const has = await PermissionsService.hasPermission(actorUserId, AppPermission.SETTINGS_EDIT_MEETING_INTEGRATIONS);
  if (!has) {
    throw new Error(tErrors.unauthorizedAction);
  }
}

// ============================================================================
// Helpers
// ============================================================================

function getAdapterEndpoints(slug: MeetingProvider): readonly string[] {
  switch (slug) {
    case "zoom":
      return ZoomMeetingAdapter.ENDPOINTS;
    case "google_meet":
      return GoogleMeetAdapter.ENDPOINTS;
    case "microsoft_teams":
      return MicrosoftTeamsAdapter.ENDPOINTS;
  }
  throw new Error(`Unhandled case in getAdapterEndpoints`);
}

function getProviderKind(slug: MeetingProvider): MeetingProviderKind {
  switch (slug) {
    case "zoom":
      return "zoom_oauth";
    case "google_meet":
      return "google_meet_oauth";
    case "microsoft_teams":
      return "microsoft_teams_oauth";
  }
  throw new Error(`Unhandled case in getProviderKind`);
}

function classifyTokenStatus(expiresAt: Date | null, revoked: boolean): MeetingIntegrationConnectedAccountStatus {
  if (revoked) return MeetingIntegrationConnectedAccountStatus.REVOKED;
  if (!expiresAt) return MeetingIntegrationConnectedAccountStatus.CONNECTED;
  const now = Date.now();
  if (expiresAt.getTime() <= now) return MeetingIntegrationConnectedAccountStatus.REAUTH_NEEDED;
  if (expiresAt.getTime() - now <= EXPIRING_SOON_MS) return MeetingIntegrationConnectedAccountStatus.EXPIRING_SOON;
  return MeetingIntegrationConnectedAccountStatus.CONNECTED;
}

// ============================================================================
// Public API
// ============================================================================

export namespace MeetingIntegrationService {
  /**
   * List all meeting integration providers with health/audit summary data.
   */
  export async function listIntegrationProviders(
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<MeetingIntegrationProviderReturnType[]> {
    await assertCanEditMeetingIntegrations(actorUserId, tErrors);

    const settled = await Promise.allSettled(
      AUTO_GEN_SLUGS.map(async slug => {
        const adapter = await resolveAdapter(slug);
        const credentialsHealthy = await safeValidateConfig(adapter);
        const tokens = await MeetingProviderTokenRepository.listByProvider(slug);
        const now = Date.now();
        const reauthNeededCount = tokens.filter(t => t.expiresAt !== null && t.expiresAt.getTime() <= now).length;

        return {
          slug,
          kind: getProviderKind(slug),
          credentialsHealthy,
          lastTestedAt: credentialsHealthy ? new Date() : null,
          connectedTeacherCount: tokens.length,
          reauthNeededCount,
          endpoints: getAdapterEndpoints(slug),
        } satisfies MeetingIntegrationProviderReturnType;
      })
    );

    const results: MeetingIntegrationProviderReturnType[] = [];
    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i];
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
      } else {
        logger.warn("listIntegrationProviders: provider resolution failed", {
          slug: AUTO_GEN_SLUGS[i],
          error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
        });
      }
    }

    return results;
  }

  /**
   * List connected OAuth token accounts for a provider, joined with user
   * display name and email.
   */
  export async function listConnectedAccounts(
    actorUserId: string,
    providerSlug: MeetingProvider,
    tErrors: ErrorsLabels
  ): Promise<MeetingIntegrationConnectedAccountReturnType[]> {
    await assertCanEditMeetingIntegrations(actorUserId, tErrors);

    const tokens = await MeetingProviderTokenRepository.listByProvider(providerSlug);
    const userIds = [...new Set(tokens.map(t => t.userId))];
    const userMap = await UserRepository.findByIds(userIds);

    const rows: MeetingIntegrationConnectedAccountReturnType[] = tokens.map(token => {
      const user = userMap.get(token.userId) ?? null;
      return {
        userId: token.userId,
        name: user?.name ?? null,
        email: user?.email ?? null,
        connectedAt: token.createdAt ?? null,
        expiresAt: token.expiresAt ?? null,
        lastRefreshedAt: token.updatedAt ?? null,
        status: classifyTokenStatus(token.expiresAt ?? null, false),
        scopes: token.scopes,
      };
    });

    return rows;
  }

  /**
   * Test a provider connection — either validate-only or a full
   * generate-and-delete round-trip.
   */
  export async function testConnection(
    actorUserId: string,
    input: TestMeetingConnectionSubmitInput,
    _tErrors: ErrorsLabels
  ): Promise<TestMeetingConnectionReturnType> {
    await assertCanEditMeetingIntegrations(actorUserId, _tErrors);

    const adapter = await resolveAdapter(input.providerSlug);
    const startedAt = Date.now();

    if (input.mode === MeetingConnectionTestMode.VALIDATE_CONFIG) {
      return runValidateConfig(adapter, startedAt);
    }

    return runGenerateAndDelete(adapter, startedAt);
  }

  /**
   * Revoke (disconnect + delete) a per-teacher OAuth token.
   */
  export async function revokeToken(
    actorUserId: string,
    input: AdminRevokeTokenSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<AdminRevokeTokenReturnType> {
    await assertCanEditMeetingIntegrations(actorUserId, tErrors);

    // Fetch decrypted token row before deletion so we can revoke at provider
    const tokenRow = await MeetingProviderTokenRepository.getByUserAndProvider(input.userId, input.providerSlug);

    // Best-effort adapter disconnect — revokes at provider & clears cached tokens
    try {
      const adapter = await getMeetingChannel(input.providerSlug);
      await adapter.disconnect(
        tokenRow?.accessToken ? { accessToken: tokenRow.accessToken, refreshToken: tokenRow.refreshToken } : undefined
      );
    } catch {
      // best-effort — continue to delete the token row
    }

    await MeetingProviderTokenRepository.deleteByUserAndProvider(input.userId, input.providerSlug);

    // Audit log
    const auditInput: CreateAuditLogInput = {
      actorUserId,
      actorType: "USER",
      entityType: "MEETING_PROVIDER_TOKEN",
      entityId: `${input.userId}:${input.providerSlug}`,
      action: "REVOKE",
      description: `meeting_provider_token.revoked for user ${input.userId} on ${input.providerSlug}`,
      previousState: null,
      newState: null,
      metadata: {
        event: "meeting_provider_token.revoked",
        userId: input.userId,
        providerSlug: input.providerSlug,
      },
    };

    try {
      await AuditService.createManyAuditLogs([auditInput]);
    } catch {
      // best-effort — audit failure should not block revocation
    }

    return {
      userId: input.userId,
      providerSlug: input.providerSlug,
      revoked: true,
    };
  }
}

// ============================================================================
// Internal — adapter resolution + test helpers
// ============================================================================

/**
 * Resolve an adapter instance for the given slug, catching errors that may
 * arise from missing env configuration.
 */
async function resolveAdapter(slug: MeetingProvider): Promise<IMeetingChannel> {
  return getMeetingChannel(slug);
}

/**
 * Safely call `validateConfig()` without throwing.
 */
async function safeValidateConfig(adapter: IMeetingChannel): Promise<boolean> {
  try {
    return await adapter.validateConfig();
  } catch {
    return false;
  }
}

/**
 * Extract structured error info from a thrown error.
 */
function extractError(err: unknown): {
  code: string;
  message: string;
  requiredScopes?: readonly string[];
  grantedScopes?: readonly string[];
} {
  if (err instanceof InsufficientScopesError) {
    return {
      code: err.code,
      message: err.upstreamMessage ?? err.message,
      requiredScopes: err.requiredScopes,
      grantedScopes: err.grantedScopes,
    };
  }
  if (err instanceof MeetingChannelError) {
    return { code: err.code, message: err.upstreamMessage ?? err.message };
  }
  return { code: "UNKNOWN", message: err instanceof Error ? err.message : String(err) };
}

/**
 * VALIDATE_CONFIG mode — call adapter.validateConfig().
 */
async function runValidateConfig(
  adapter: IMeetingChannel,
  startedAt: number
): Promise<TestMeetingConnectionReturnType> {
  let ok = false;
  let errorCode: string | null = null;
  let errorMessage: string | null = null;
  let requiredScopes: readonly string[] | null = null;
  let grantedScopes: readonly string[] | null = null;

  try {
    ok = await adapter.validateConfig();
  } catch (err) {
    const extracted = extractError(err);
    errorCode = extracted.code;
    errorMessage = extracted.message;
    requiredScopes = extracted.requiredScopes ?? null;
    grantedScopes = extracted.grantedScopes ?? null;
  }

  return {
    ok,
    latencyMs: Date.now() - startedAt,
    mode: MeetingConnectionTestMode.VALIDATE_CONFIG,
    testJoinUrl: null,
    deleted: null,
    upstreamResponseSummary: ok ? "Credentials valid" : "Credentials invalid or missing",
    errorCode,
    errorMessage,
    rawUpstreamPayload: null,
    requiredScopes,
    grantedScopes,
  };
}

/**
 * GENERATE_AND_DELETE mode — create a throwaway meeting then delete it.
 */
async function runGenerateAndDelete(
  adapter: IMeetingChannel,
  startedAt: number
): Promise<TestMeetingConnectionReturnType> {
  try {
    const result = await adapter.generateMeeting({
      topic: "[Test] Siraj integration probe - safe to delete",
      durationMinutes: 15,
    });

    let deleted = false;
    let summary = `Generated meeting. Join URL: ${result.joinUrl}`;

    if (result.meetingId && adapter.deleteMeeting) {
      try {
        await adapter.deleteMeeting(result.meetingId);
        deleted = true;
      } catch {
        summary += " (delete failed — test meeting remains)";
      }
    } else {
      summary += " (delete not supported by provider — test meeting remains)";
    }

    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      mode: MeetingConnectionTestMode.GENERATE_AND_DELETE,
      testJoinUrl: result.joinUrl,
      deleted,
      upstreamResponseSummary: summary,
      errorCode: null,
      errorMessage: null,
      rawUpstreamPayload: result.providerMetadata ?? null,
      requiredScopes: null,
      grantedScopes: null,
    };
  } catch (err) {
    const extracted = extractError(err);
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      mode: MeetingConnectionTestMode.GENERATE_AND_DELETE,
      testJoinUrl: null,
      deleted: null,
      upstreamResponseSummary: `Provider error: ${extracted.message}`,
      errorCode: extracted.code,
      errorMessage: extracted.message,
      rawUpstreamPayload: null,
      requiredScopes: extracted.requiredScopes ?? null,
      grantedScopes: extracted.grantedScopes ?? null,
    };
  }
}
