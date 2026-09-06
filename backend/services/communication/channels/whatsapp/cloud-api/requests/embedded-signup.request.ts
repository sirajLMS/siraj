/**
 * Graph API request builders for WhatsApp Embedded Signup (ES v4) — the
 * coexistence onboarding flow:
 *
 *  1. `GET /oauth/access_token` — exchange the single-use authorization
 *     `code` from `FB.login` for a business-integration access token.
 *  2. `POST /{waba_id}/subscribed_apps` — attach the app to the WABA so
 *     webhooks flow to this deployment.
 *  3. `GET /{phone_number_id}?fields=is_on_biz_app,platform_type,display_phone_number`
 *     — confirm the number still runs the Business app (`is_on_biz_app`)
 *     while being Cloud-API reachable (`platform_type === "CLOUD_API"`).
 *
 * Builders are pure; the account service executes the fetches.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type {
  ExchangeEmbeddedSignupCodeInput,
  ExchangeEmbeddedSignupCodeResponseBody,
  ExchangeEmbeddedSignupCodeResult,
  GetPhoneNumberPlatformInput,
  GetPhoneNumberPlatformResponseBody,
  GetPhoneNumberPlatformResult,
  GraphApiRequestContext,
  GraphApiRequestInit,
  SubscribeAppToWabaInput,
  SubscribedAppsResponseBody,
} from "@/backend/types";

/** Largest Authorization Code length Meta is known to issue (defensive cap). */
const MAX_CODE_LENGTH = 2048;

/**
 * Builds the embedded-signup code exchange request:
 * `GET /oauth/access_token?client_id=…&client_secret=…&code=…`.
 * No bearer header — the app secret authenticates this call.
 */
export function buildExchangeEmbeddedSignupCodeRequest(
  apiVersion: string | undefined,
  input: ExchangeEmbeddedSignupCodeInput
): GraphApiRequestInit {
  // Internal developer-facing validation errors — caught by the caller and
  // wrapped into structured error codes.
  if (!input.code || input.code.length > MAX_CODE_LENGTH) {
    throw new Error("Invalid code: must be non-empty and ≤2048 chars");
  }
  if (!input.appId || !input.appSecret) {
    throw new Error("Invalid app credentials: appId and appSecret are required");
  }
  const query =
    `client_id=${encodeURIComponent(input.appId)}` +
    `&client_secret=${encodeURIComponent(input.appSecret)}` +
    `&code=${encodeURIComponent(input.code)}`;
  return {
    url: buildGraphUrl("/oauth/access_token", apiVersion, query),
    init: { method: "GET" },
  };
}

/**
 * Parses the code-exchange response, returning the business-integration
 * token. @throws when `access_token` is absent (Meta returned an envelope
 * without a token).
 */
export function parseExchangeEmbeddedSignupCodeResponse(
  body: ExchangeEmbeddedSignupCodeResponseBody
): ExchangeEmbeddedSignupCodeResult {
  const accessToken = typeof body?.access_token === "string" ? body.access_token : "";
  if (accessToken.length === 0) {
    // Internal adapter error — not user-facing (unexpected Meta response shape)
    throw new Error("Graph API oauth/access_token: missing access_token in response");
  }
  return { accessToken };
}

/**
 * Builds `POST /{waba_id}/subscribed_apps` — attaches the app to the WABA
 * so coexistence webhooks (history, contacts, echoes) reach this deployment.
 */
export function buildSubscribeAppToWabaRequest(
  ctx: GraphApiRequestContext,
  input: SubscribeAppToWabaInput
): GraphApiRequestInit {
  if (!input.wabaId || input.wabaId.length > 64) {
    throw new Error("Invalid wabaId: must be non-empty and ≤64 chars");
  }
  return {
    url: buildGraphUrl(`/${input.wabaId}/subscribed_apps`, ctx.apiVersion),
    init: {
      method: "POST",
      headers: buildAuthHeaders(ctx.accessToken, true),
      body: "{}",
    },
  };
}

/**
 * Parses the `subscribed_apps` response. @throws when `success` is not true.
 */
export function parseSubscribeAppToWabaResponse(body: SubscribedAppsResponseBody): void {
  if (body?.success !== true) {
    throw new Error("Graph API subscribed_apps: success flag missing");
  }
}

/**
 * Builds `GET /{phone_number_id}?fields=is_on_biz_app,platform_type,display_phone_number`
 * — the coexistence confirmation read.
 */
export function buildGetPhoneNumberPlatformRequest(
  ctx: GraphApiRequestContext,
  input: GetPhoneNumberPlatformInput
): GraphApiRequestInit {
  if (!input.phoneNumberId || input.phoneNumberId.length > 64) {
    throw new Error("Invalid phoneNumberId: must be non-empty and ≤64 chars");
  }
  const query = "fields=is_on_biz_app,platform_type,display_phone_number";
  return {
    url: buildGraphUrl(`/${input.phoneNumberId}`, ctx.apiVersion, query),
    init: { method: "GET", headers: buildAuthHeaders(ctx.accessToken) },
  };
}

/** Parses the coexistence-confirmation response. */
export function parseGetPhoneNumberPlatformResponse(
  body: GetPhoneNumberPlatformResponseBody
): GetPhoneNumberPlatformResult {
  return {
    displayPhoneNumber: typeof body?.display_phone_number === "string" ? body.display_phone_number : null,
    isOnBizApp: body?.is_on_biz_app === true,
    platformType: typeof body?.platform_type === "string" ? body.platform_type : null,
  };
}
