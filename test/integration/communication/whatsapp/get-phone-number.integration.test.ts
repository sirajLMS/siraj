/**
 * WhatsApp Cloud API — get-phone-number live smoke (REQ-9, Q1, Q5).
 *
 * Executes one real GET /{phone_number_id} call against the Meta Graph API
 * to confirm the request builder is wired correctly and that
 * `portfolio_messaging_limit_tier` is carried verbatim (Q5).
 *
 * Run: `bun run test:live-comm` or `bun run test:integration`
 */
import { expect, test } from "bun:test";
import type { GraphApiRequestContext } from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.types";
import {
  buildRequest,
  parseResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";

const hasCreds = Boolean(accessToken && phoneNumberId);
const describeLive = describeLiveWhen(hasCreds, "get-phone-number @live-comm");

describeLive("get-phone-number @live-comm", () => {
  test("GET /{phone_number_id} returns verbatim portfolio_messaging_limit_tier (Q5)", async () => {
    const ctx: GraphApiRequestContext = { accessToken, apiVersion: undefined };
    const { url, init } = buildRequest(ctx, { phoneNumberId });

    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
    expect(response.ok).toBe(true);

    const body = await response.json();
    const result = parseResponse(body);

    expect(result.id).toBe(phoneNumberId);
    expect(result.display_phone_number).toBeDefined();
    expect(result.verified_name).toBeDefined();
    expect(result.portfolio_messaging_limit_tier).toBeDefined();
  });
});
