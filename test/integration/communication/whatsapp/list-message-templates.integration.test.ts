/**
 * WhatsApp Cloud API — list-message-templates live smoke (REQ-9, Q1, B6).
 *
 * Executes one real GET /{waba_id}/message_templates call against the Meta
 * Graph API and asserts each template carries an exact `language.code`
 * preserved verbatim from Meta's payload (B6).
 *
 * Run: `bun run test:live-comm` or `bun run test:integration`
 */
import { expect, test } from "bun:test";
import {
  buildListMessageTemplatesRequest,
  collectAllTemplates,
  parseListMessageTemplatesResponse,
} from "@/backend/services";
import type { GraphApiRequestContext, GraphApiRequestInit, ListMessageTemplatesResponseBody } from "@/backend/types";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const wabaId = process.env.WHATSAPP_WABA_ID ?? "";

const hasCreds = Boolean(accessToken && wabaId);
const describeLive = describeLiveWhen(hasCreds, "list-message-templates @live-comm");

const fetchPage = async (request: GraphApiRequestInit): Promise<ListMessageTemplatesResponseBody> => {
  const response = await fetch(request.url, {
    ...request.init,
    signal: AbortSignal.timeout(10_000),
  });
  expect(response.ok).toBe(true);
  const body: ListMessageTemplatesResponseBody = await response.json();
  return body;
};

describeLive("list-message-templates @live-comm", () => {
  test("collectAllTemplates follows pagination and carries verbatim language.code (B6)", async () => {
    const ctx: GraphApiRequestContext = { accessToken, apiVersion: undefined };

    const allTemplates = await collectAllTemplates(ctx, { wabaId }, fetchPage);

    expect(Array.isArray(allTemplates)).toBe(true);
    expect(allTemplates.length).toBeGreaterThan(0);

    for (const template of allTemplates) {
      expect(template.name).toBeDefined();
      expect(template.language.code).toBeDefined();
      expect(template.language.code.length).toBeGreaterThan(0);
    }
  });

  test("first page parseResponse extracts templates with language.code (B6)", async () => {
    const ctx: GraphApiRequestContext = { accessToken, apiVersion: undefined };
    const { url, init } = buildListMessageTemplatesRequest(ctx, { wabaId });

    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
    expect(response.ok).toBe(true);

    const body: ListMessageTemplatesResponseBody = await response.json();
    const { templates, nextCursor } = parseListMessageTemplatesResponse(body);

    expect(templates.length).toBeGreaterThan(0);
    expect(nextCursor).toBeUndefined();

    const first = templates[0];
    expect(first.language.code).toBeDefined();
    expect(first.language.code.length).toBeGreaterThan(0);
  });
});
