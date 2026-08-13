/**
 * Per-user meeting-provider OAuth connect/disconnect service.
 *
 * Strengthens the admin-level `MeetingIntegrationService` (which operates on
 * any user's tokens with `SETTINGS_EDIT_MEETING_INTEGRATIONS`) with
 * self-service OAuth for the logged-in user under the
 * `MEETING_CONFIGS_MANAGE_OWN` permission.
 *
 * The "state" nonce returned by `connectProviderOAuth` is a signed JWT
 * (HS256, 10-minute expiry) carrying `userId`, `providerSlug`, `returnPath`,
 * and a random `nonce`. The callback handler verifies this JWT to prove the
 * round-trip originated from us before exchanging the authorization code.
 */

import { randomUUID } from "node:crypto";
import { GraphQLError } from "graphql";
import { type JWTPayload as JoseJWTPayload, jwtVerify, SignJWT } from "jose";
import { MeetingProviderTokenRepository } from "@/backend/db/repo/meeting/meeting-provider-token.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { AppPermission } from "@/backend/enum";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { MeetingProvider } from "@/backend/services/meeting/channels/IMeetingChannel";
import { getMeetingChannel } from "@/backend/services/meeting/channels/MeetingChannelFactory";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  ConnectMeetingProviderOAuthReturnType,
  ConnectMeetingProviderOAuthSubmitInput,
  CreateAuditLogInput,
  DisconnectMeetingProviderOAuthReturnType,
  DisconnectMeetingProviderOAuthSubmitInput,
  MyConnectedMeetingProviderReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Validates that `returnPath` is a safe relative path to prevent open
 * redirect attacks. A valid return path must start with `/` and must
 * NOT start with `//` (protocol-relative URLs like `//evil.com`).
 */
function validateReturnPath(returnPath: string, tErrors: ErrorsLabels): void {
  if (!returnPath.startsWith("/") || returnPath.startsWith("//")) {
    throw new GraphQLError(tErrors.meetingProvider.invalidReturnPath);
  }
}

// ============================================================================
// Constants
// ============================================================================

/** OAuth state JWT expiry — 10 minutes. */
const OAUTH_STATE_EXPIRY = "10m";

// ============================================================================
// Permission assertion (self-service — own meeting configs)
// ============================================================================

async function assertCanManageOwnMeetingConfigs(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const has = await PermissionsService.hasPermission(actorUserId, AppPermission.MEETING_CONFIGS_MANAGE_OWN);
  if (!has) {
    throw new Error(tErrors.unauthorizedAction);
  }
}

// ============================================================================
// State JWT helpers
// ============================================================================

export interface MeetingOAuthStatePayload extends JoseJWTPayload {
  userId: string;
  providerSlug: MeetingProvider;
  returnPath: string;
  nonce: string;
}

const MEETING_PROVIDERS: readonly MeetingProvider[] = ["zoom", "google_meet", "microsoft_teams"];

function isMeetingProvider(value: string): value is MeetingProvider {
  return (MEETING_PROVIDERS as readonly string[]).includes(value);
}

function isOAuthStatePayload(payload: JoseJWTPayload): payload is MeetingOAuthStatePayload {
  return (
    typeof payload.userId === "string" &&
    typeof payload.providerSlug === "string" &&
    isMeetingProvider(payload.providerSlug) &&
    typeof payload.returnPath === "string" &&
    typeof payload.nonce === "string"
  );
}

function getStateSigningSecret(): Uint8Array {
  const config = getEnvironmentConfig();
  return new TextEncoder().encode(config.jwtSecret);
}

async function signOAuthState(userId: string, providerSlug: MeetingProvider, returnPath: string): Promise<string> {
  const nonce = randomUUID();
  return new SignJWT({
    userId,
    providerSlug,
    returnPath,
    nonce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(OAUTH_STATE_EXPIRY)
    .sign(getStateSigningSecret());
}

export async function verifyOAuthState(state: string): Promise<MeetingOAuthStatePayload | null> {
  try {
    const { payload } = await jwtVerify(state, getStateSigningSecret());
    if (!isOAuthStatePayload(payload)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ============================================================================
// Authorize URL builders
// ============================================================================

function buildRedirectUri(providerSlug: MeetingProvider): string {
  const config = getEnvironmentConfig();
  const baseUrl = config.oauthRedirectBaseUrl ?? config.nextPublicBaseUrl ?? "";
  // Use split/join instead of replace/replaceAll for better compatibility and to
  // satisfy static analysis rules that prefer explicit all-occurrence handling.
  const pathSlug = providerSlug.split("_").join("-");
  return `${baseUrl.replace(/\/$/, "")}/api/oauth/${pathSlug}/callback`;
}

const ZOOM_SCOPES = ["meeting:write:meeting", "user:read:user"] as const;
const GOOGLE_SCOPES = ["https://www.googleapis.com/auth/meetings.space.created"] as const;
const MS_TEAMS_SCOPES = ["https://graph.microsoft.com/OnlineMeetings.ReadWrite", "User.Read"] as const;

/**
 * Builds the common `URLSearchParams` shared by all meeting-provider OAuth
 * authorize endpoints, then layers provider-specific extras on top.
 */
function buildOAuthParams(
  redirectUri: string,
  state: string,
  clientId: string,
  scope: string,
  extraParams?: Record<string, string>
): URLSearchParams {
  return new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope,
    ...extraParams,
  });
}

function buildZoomAuthorizeUrl(redirectUri: string, state: string): string {
  const config = getEnvironmentConfig();
  const params = buildOAuthParams(redirectUri, state, config.zoomClientId ?? "", ZOOM_SCOPES.join(" "));
  return `https://zoom.us/oauth/authorize?${params.toString()}`;
}

function buildGoogleMeetAuthorizeUrl(redirectUri: string, state: string): string {
  const config = getEnvironmentConfig();
  const params = buildOAuthParams(redirectUri, state, config.googleMeetClientId ?? "", GOOGLE_SCOPES.join(" "), {
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function buildMicrosoftTeamsAuthorizeUrl(redirectUri: string, state: string): string {
  const config = getEnvironmentConfig();
  const tenantId = config.msTeamsTenantId ?? "common";
  const params = buildOAuthParams(redirectUri, state, config.msTeamsClientId ?? "", MS_TEAMS_SCOPES.join(" "), {
    response_mode: "query",
  });
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

function buildAuthorizeUrl(providerSlug: MeetingProvider, redirectUri: string, state: string): string {
  switch (providerSlug) {
    case "zoom":
      return buildZoomAuthorizeUrl(redirectUri, state);
    case "google_meet":
      return buildGoogleMeetAuthorizeUrl(redirectUri, state);
    case "microsoft_teams":
      return buildMicrosoftTeamsAuthorizeUrl(redirectUri, state);
  }
  throw new Error(`Unhandled case in buildAuthorizeUrl`);
}

// ============================================================================
// Public API
// ============================================================================

export namespace MeetingOAuthService {
  /**
   * Mint a signed state JWT and build the provider's authorize URL for the
   * logged-in user to start the OAuth flow.
   */
  export async function connectProviderOAuth(
    input: ConnectMeetingProviderOAuthSubmitInput,
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<ConnectMeetingProviderOAuthReturnType> {
    await assertCanManageOwnMeetingConfigs(actorUserId, tErrors);

    validateReturnPath(input.returnPath, tErrors);

    const state = await signOAuthState(actorUserId, input.providerSlug, input.returnPath);
    const redirectUri = buildRedirectUri(input.providerSlug);
    const authorizeUrl = buildAuthorizeUrl(input.providerSlug, redirectUri, state);

    logger.info("Meeting OAuth: connect initiated", {
      actorUserId,
      providerSlug: input.providerSlug,
    });

    return { authorizeUrl, state };
  }

  /**
   * Best-effort revoke provider access, delete the stored token row, and
   * audit the disconnection. Returns `{ ok, providerSlug }`.
   */
  export async function disconnectProviderOAuth(
    input: DisconnectMeetingProviderOAuthSubmitInput,
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<DisconnectMeetingProviderOAuthReturnType> {
    await assertCanManageOwnMeetingConfigs(actorUserId, tErrors);

    // Fetch decrypted token row before deletion so we can revoke at provider
    const tokenRow = await MeetingProviderTokenRepository.getByUserAndProvider(actorUserId, input.providerSlug);

    // Best-effort adapter disconnect — revokes at provider & clears cached tokens
    try {
      const adapter = await getMeetingChannel(input.providerSlug);
      await adapter.disconnect(
        tokenRow?.accessToken ? { accessToken: tokenRow.accessToken, refreshToken: tokenRow.refreshToken } : undefined
      );
    } catch (error) {
      logger.warn("Meeting OAuth: best-effort adapter disconnect failed", {
        providerSlug: input.providerSlug,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await MeetingProviderTokenRepository.deleteByUserAndProvider(actorUserId, input.providerSlug);

    const auditInput: CreateAuditLogInput = {
      actorUserId,
      actorType: "USER",
      entityType: "MEETING_PROVIDER_TOKEN",
      entityId: `${actorUserId}:${input.providerSlug}`,
      action: "REVOKE",
      description: `meeting_provider_token.disconnected (self-service) for user ${actorUserId} on ${input.providerSlug}`,
      previousState: null,
      newState: null,
      metadata: {
        event: "meeting_provider_token.disconnected",
        userId: actorUserId,
        providerSlug: input.providerSlug,
      },
    };

    try {
      await AuditService.createManyAuditLogs([auditInput]);
    } catch {
      // best-effort — audit failure should not block disconnection
    }

    return {
      ok: true,
      providerSlug: input.providerSlug,
    };
  }

  /**
   * List the caller's own connected OAuth provider tokens with email from the
   * users table. Self-service (requires `MEETING_CONFIGS_MANAGE_OWN`).
   */
  export async function listOwnConnectedProviders(
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<MyConnectedMeetingProviderReturnType[]> {
    await assertCanManageOwnMeetingConfigs(actorUserId, tErrors);

    const tokens = await MeetingProviderTokenRepository.listByUser(actorUserId);
    const user = await UserRepository.findById(actorUserId);
    const email = user?.email ?? null;

    return tokens.reduce<MyConnectedMeetingProviderReturnType[]>((acc, token) => {
      if (isMeetingProvider(token.providerSlug)) {
        acc.push({
          providerSlug: token.providerSlug,
          email,
          connectedAt: token.createdAt ?? null,
          expiresAt: token.expiresAt ?? null,
        });
      }
      return acc;
    }, []);
  }
}
