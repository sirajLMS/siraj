/**
 * WhatsApp Cloud API — send-template-message live smoke (REQ-9, Q1).
 *
 * Executes one real POST /{phone_number_id}/messages (type template) call
 * against the Meta Graph API to confirm the request builder is wired correctly.
 *
 * Run: `bun run test:live-comm` or `bun run test:integration`
 */
import { expect, test } from "bun:test";
import type { GraphApiRequestContext } from "@/backend/types";
import {
  buildSendTemplateMessageRequest,
  parseSendTemplateResponse,
} from "@/backend/services";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const testToPhone = process.env.WHATSAPP_TEST_TO_PHONE ?? "";
const templateName = process.env.WHATSAPP_TEST_TEMPLATE_NAME ?? "hello_world";
const templateLanguage = process.env.WHATSAPP_TEST_TEMPLATE_LANGUAGE ?? "en_US";

const hasCreds = Boolean(accessToken && phoneNumberId && testToPhone);
const describeLive = describeLiveWhen(hasCreds, "send-template-message @live-comm");

describeLive("send-template-message @live-comm", () => {
  test("buildRequest + fetch returns a provider message ID from Meta Graph API", async () => {
    const ctx: GraphApiRequestContext = { accessToken, apiVersion: undefined };
    const { url, init } = buildSendTemplateMessageRequest(ctx, {
      phoneNumberId,
      to: testToPhone,
      templateName,
      languageCode: templateLanguage,
    });

    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.ok).toBe(true);

    const body = await response.json();
    const result = parseSendTemplateResponse(body);

    expect(result.providerMessageId).toBeDefined();
    expect(result.providerMessageId.length).toBeGreaterThan(0);
  });
});
