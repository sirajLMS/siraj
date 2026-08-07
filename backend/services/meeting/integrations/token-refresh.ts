/**
 * Per-user OAuth token refresh utility.
 *
 * Exchanges a stored refresh token for a new access token at the provider's
 * token endpoint. When the provider returns `invalid_grant`, the refresh
 * token is expired or has been revoked and the user must re-authenticate —
 * we throw {@link ProviderReauthRequiredError} so the caller can surface
 * a re-connect prompt instead of a generic error.
 *
 * Unlike the org-level server-to-server flows in the adapters (Zoom
 * `account_credentials`, Google JWT-bearer + DWD, Teams
 * `client_credentials`), this module performs a standard RFC 6749
 * `refresh_token` grant using the app client ID/secret from environment
 * configuration.
 */

import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import type { MeetingProvider } from "@/backend/services/meeting/channels/IMeetingChannel";
import { ProviderReauthRequiredError } from "@/backend/services/meeting/channels/IMeetingChannel";

// ============================================================================
// Types
// ============================================================================

export interface RefreshedToken {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresAt: Date;
}

interface TokenEndpointResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

interface TokenEndpointError {
  error: string;
  error_description?: string;
}

// ============================================================================
// Provider-specific token endpoint configuration
// ============================================================================

interface ProviderTokenConfig {
  readonly tokenUrl: string;
  readonly clientId: string | undefined;
  readonly clientSecret: string | undefined;
}

function getProviderTokenConfig(providerSlug: MeetingProvider): ProviderTokenConfig {
  const config = getEnvironmentConfig();

  switch (providerSlug) {
    case "zoom":
      return {
        tokenUrl: "https://zoom.us/oauth/token",
        clientId: config.zoomClientId,
        clientSecret: config.zoomClientSecret,
      };
    case "google_meet":
      return {
        tokenUrl: "https://oauth2.googleapis.com/token",
        clientId: config.googleMeetClientId,
        clientSecret: config.googleMeetClientSecret,
      };
    case "microsoft_teams": {
      const tenant = config.msTeamsTenantId ?? "common";
      return {
        tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
        clientId: config.msTeamsClientId,
        clientSecret: config.msTeamsClientSecret,
      };
    }
  }
}

// ============================================================================
// Refresh access token
// ============================================================================

/**
 * Exchange a stored refresh token for a new access token.
 *
 * @throws {ProviderReauthRequiredError} when the provider returns
 *   `invalid_grant` — the refresh token is expired or revoked.
 */
export async function refreshAccessToken(
  providerSlug: MeetingProvider,
  refreshToken: string,
  userId?: string
): Promise<RefreshedToken> {
  const { tokenUrl, clientId, clientSecret } = getProviderTokenConfig(providerSlug);

  if (!clientId || !clientSecret) {
    logger.warn("token-refresh: missing client credentials for provider", { providerSlug });
    throw new ProviderReauthRequiredError(providerSlug, userId, "Missing OAuth client credentials");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (error) {
    logger.warn("token-refresh: network error", {
      providerSlug,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new ProviderReauthRequiredError(providerSlug, userId, error instanceof Error ? error.message : String(error));
  }

  if (!response.ok) {
    let errorBody: TokenEndpointError | null = null;
    try {
      errorBody = (await response.json()) as TokenEndpointError;
    } catch {
      // Non-JSON error response
    }

    const errorCode = errorBody?.error;
    const errorDescription = errorBody?.error_description;

    if (errorCode === "invalid_grant") {
      logger.info("token-refresh: invalid_grant, re-auth required", { providerSlug, userId });
      throw new ProviderReauthRequiredError(
        providerSlug,
        userId,
        errorDescription ?? "The refresh token is expired or revoked."
      );
    }

    logger.warn("token-refresh: non-ok response", {
      providerSlug,
      status: response.status,
      errorCode,
      errorDescription,
    });

    // For non-invalid_grant errors (server errors, rate limits, etc.), throw a generic
    // error so the caller can retry instead of forcing the user to re-authenticate.
    throw new Error(
      `Token refresh failed for "${providerSlug}" (${response.status}): ${errorDescription ?? errorCode ?? "Unknown error"}`
    );
  }

  const tokenData = (await response.json()) as TokenEndpointResponse;
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt,
  };
}
