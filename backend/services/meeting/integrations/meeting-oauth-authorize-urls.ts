import { getEnvironmentConfig } from "@/backend/lib/env";
import type { MeetingProvider } from "@/backend/types";

export function buildRedirectUri(providerSlug: MeetingProvider): string {
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
  codeChallenge: string,
  extraParams?: Record<string, string>
): URLSearchParams {
  return new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope,
    // PKCE (RFC 7636): S256 challenge — the verifier only travels back inside
    // the signed state JWT and is sent at the token exchange step.
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    ...extraParams,
  });
}

function buildZoomAuthorizeUrl(redirectUri: string, state: string, codeChallenge: string): string {
  const config = getEnvironmentConfig();
  const params = buildOAuthParams(redirectUri, state, config.zoomClientId ?? "", ZOOM_SCOPES.join(" "), codeChallenge);
  return `https://zoom.us/oauth/authorize?${params.toString()}`;
}

function buildGoogleMeetAuthorizeUrl(redirectUri: string, state: string, codeChallenge: string): string {
  const config = getEnvironmentConfig();
  const params = buildOAuthParams(
    redirectUri,
    state,
    config.googleMeetClientId ?? "",
    GOOGLE_SCOPES.join(" "),
    codeChallenge,
    {
      access_type: "offline",
      prompt: "consent",
    }
  );
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function buildMicrosoftTeamsAuthorizeUrl(redirectUri: string, state: string, codeChallenge: string): string {
  const config = getEnvironmentConfig();
  const tenantId = config.msTeamsTenantId ?? "common";
  const params = buildOAuthParams(
    redirectUri,
    state,
    config.msTeamsClientId ?? "",
    MS_TEAMS_SCOPES.join(" "),
    codeChallenge,
    {
      response_mode: "query",
    }
  );
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export function buildAuthorizeUrl(
  providerSlug: MeetingProvider,
  redirectUri: string,
  state: string,
  codeChallenge: string
): string {
  switch (providerSlug) {
    case "zoom":
      return buildZoomAuthorizeUrl(redirectUri, state, codeChallenge);
    case "google_meet":
      return buildGoogleMeetAuthorizeUrl(redirectUri, state, codeChallenge);
    case "microsoft_teams":
      return buildMicrosoftTeamsAuthorizeUrl(redirectUri, state, codeChallenge);
  }
  throw new Error(`Unhandled case in buildAuthorizeUrl`);
}
