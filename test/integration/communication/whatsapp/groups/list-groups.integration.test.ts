/**
 * WhatsApp Cloud API — list-groups live smoke.
 *
 * Executes one real GET /{phone_number_id}/groups call against the Meta
 * Graph API to confirm the request builder is wired correctly. Zero-cost
 * path — a read-only list that mutates nothing.
 *
 * Run: `bun run test:live-comm` or `bun run test:integration`
 */
import { expect, test } from "bun:test";
import { buildListGroupsRequest, parseListGroupsResponse } from "@/backend/services";
import type { GraphApiRequestContext, ListGroupsRaw } from "@/backend/types";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";

const hasCreds = Boolean(accessToken && phoneNumberId);
const describeLive = describeLiveWhen(hasCreds, "list-groups @live-comm");

describeLive("list-groups @live-comm", () => {
  test("buildRequest + fetch returns a group page from Meta Graph API", async () => {
    const ctx: GraphApiRequestContext = { accessToken, apiVersion: undefined };
    const { url, init } = buildListGroupsRequest(ctx, { phoneNumberId, limit: 25 });

    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.ok).toBe(true);
    const body: ListGroupsRaw = await response.json();
    const page = parseListGroupsResponse(body);

    expect(Array.isArray(page.groups)).toBe(true);
    for (const group of page.groups) {
      expect(group.groupId).toBeDefined();
      expect(group.groupId.length).toBeGreaterThan(0);
    }
  });
});
