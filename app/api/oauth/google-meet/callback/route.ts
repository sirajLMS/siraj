import type { NextRequest, NextResponse } from "next/server";

import { handleOAuthCallback, type OAuthCallbackConfig } from "@/app/api/oauth/shared/oauth-callback-handler";

/**
 * Google Meet OAuth callback — receives the `code`/`state` query params from
 * Google's authorize redirect, exchanges the code for access/refresh tokens,
 * persists them, and redirects back to `returnPath`. The shared flow lives in
 * `oauth-callback-handler`; this file only supplies the Google-specific config.
 */
const googleMeetConfig: OAuthCallbackConfig = {
  providerSlug: "google_meet",
  displayName: "Google Meet",
  buildTokenUrl: () => "https://oauth2.googleapis.com/token",
  resolveClientId: config => config.googleMeetClientId ?? "",
  resolveClientSecret: config => config.googleMeetClientSecret ?? "",
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleOAuthCallback(request, googleMeetConfig);
}
