import type { NextRequest, NextResponse } from "next/server";

import { handleOAuthCallback, type OAuthCallbackConfig } from "@/app/api/oauth/shared/oauth-callback-handler";

/**
 * Microsoft Teams OAuth callback — receives the `code`/`state` query params
 * from Microsoft's authorize redirect, exchanges the code for access/refresh
 * tokens, persists them, and redirects back to `returnPath`. The shared flow
 * lives in `oauth-callback-handler`; this file only supplies the
 * Microsoft-Teams-specific config (tenant-aware token URL + scope param).
 */
const MS_TEAMS_TOKEN_SCOPES = "https://graph.microsoft.com/OnlineMeetings.ReadWrite User.Read";

const microsoftTeamsConfig: OAuthCallbackConfig = {
  providerSlug: "microsoft_teams",
  displayName: "Microsoft Teams",
  buildTokenUrl: config => `https://login.microsoftonline.com/${config.msTeamsTenantId ?? "common"}/oauth2/v2.0/token`,
  resolveClientId: config => config.msTeamsClientId ?? "",
  resolveClientSecret: config => config.msTeamsClientSecret ?? "",
  extraTokenParams: { scope: MS_TEAMS_TOKEN_SCOPES },
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleOAuthCallback(request, microsoftTeamsConfig);
}
