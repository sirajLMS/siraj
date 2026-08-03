import type { NextRequest, NextResponse } from "next/server";

import { handleOAuthCallback, type OAuthCallbackConfig } from "@/app/api/oauth/shared/oauth-callback-handler";

/**
 * Zoom OAuth callback — receives the `code`/`state` query params from Zoom's
 * authorize redirect, exchanges the code for access/refresh tokens, persists
 * them, and redirects back to `returnPath`. The shared flow lives in
 * `oauth-callback-handler`; this file only supplies the Zoom-specific config.
 */
const zoomConfig: OAuthCallbackConfig = {
  providerSlug: "zoom",
  displayName: "Zoom",
  buildTokenUrl: () => "https://zoom.us/oauth/token",
  resolveClientId: config => config.zoomClientId ?? "",
  resolveClientSecret: config => config.zoomClientSecret ?? "",
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleOAuthCallback(request, zoomConfig);
}
