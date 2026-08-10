/**
 * WhatsApp Cloud API — list-phone-numbers live smoke (REQ-9, Q1, P2).
 *
 * Executes one real GET /{waba_id}/phone_numbers call against the Meta
 * Graph API and asserts the pagination loop terminates with a full result
 * set (P2 constraint).
 *
 * Run: `bun run test:live-comm` or `bun run test:integration`
 */
import { expect, test } from "bun:test";
import type {
  GraphApiRequestContext,
  GraphApiRequestInit,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.types";
import type { ListPhoneNumbersResponseBody } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-phone-numbers.request";
import {
  buildRequest,
  collectAllPhoneNumbers,
  parseResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-phone-numbers.request";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const wabaId = process.env.WHATSAPP_WABA_ID ?? "";

const hasCreds = Boolean(accessToken && wabaId);
const describeLive = describeLiveWhen(hasCreds, "list-phone-numbers @live-comm");

const fetchPage = async (request: GraphApiRequestInit): Promise<ListPhoneNumbersResponseBody> => {
  const response = await fetch(request.url, {
    ...request.init,
    signal: AbortSignal.timeout(10_000),
  });
  expect(response.ok).toBe(true);
  return response.json() as Promise<ListPhoneNumbersResponseBody>;
};

describeLive("list-phone-numbers @live-comm", () => {
  test("collectAllPhoneNumbers follows cursor pagination and terminates (P2)", async () => {
    const ctx: GraphApiRequestContext = { accessToken, apiVersion: undefined };

    const allPhoneNumbers = await collectAllPhoneNumbers(ctx, { wabaId }, fetchPage);

    expect(Array.isArray(allPhoneNumbers)).toBe(true);
    expect(allPhoneNumbers.length).toBeGreaterThan(0);

    const first = allPhoneNumbers[0];
    expect(first.id).toBeDefined();
    expect(first.display_phone_number).toBeDefined();
  });

  test("first page parseResponse extracts phone numbers and cursor", async () => {
    const ctx: GraphApiRequestContext = { accessToken, apiVersion: undefined };
    const { url, init } = buildRequest(ctx, { wabaId });

    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
    expect(response.ok).toBe(true);

    const body = (await response.json()) as ListPhoneNumbersResponseBody;
    const { phoneNumbers, nextCursor } = parseResponse(body);

    expect(phoneNumbers.length).toBeGreaterThan(0);
    expect(nextCursor).toBeUndefined();
  });
});
