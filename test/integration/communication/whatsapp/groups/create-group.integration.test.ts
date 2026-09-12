/**
 * WhatsApp Cloud API — create-group live smoke.
 *
 * Executes one real POST /{phone_number_id}/groups call against the Meta
 * Graph API to confirm the request builder is wired correctly, then deletes
 * the probe group so the live WABA is left clean.
 *
 * Run: `bun run test:live-comm` or `bun run test:integration`
 */
import { expect, test } from "bun:test";
import {
  buildCreateGroupRequest,
  buildDeleteGroupRequest,
  parseCreateGroupResponse,
  parseDeleteGroupResponse,
} from "@/backend/services";
import type { GraphApiRequestContext } from "@/backend/types";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";

const hasCreds = Boolean(accessToken && phoneNumberId);
const describeLive = describeLiveWhen(hasCreds, "create-group @live-comm");

describeLive("create-group @live-comm", () => {
  test("buildRequest + fetch returns a group id from Meta Graph API, then deletes the probe group", async () => {
    const ctx: GraphApiRequestContext = { accessToken, apiVersion: undefined };
    const create = buildCreateGroupRequest(ctx, {
      phoneNumberId,
      subject: "Siraj create-group smoke",
    });

    const createResponse = await fetch(create.url, {
      ...create.init,
      signal: AbortSignal.timeout(10_000),
    });

    expect(createResponse.ok).toBe(true);
    const groupId = parseCreateGroupResponse(await createResponse.json()).groupId;
    expect(groupId).toBeDefined();
    expect(groupId.length).toBeGreaterThan(0);

    const remove = buildDeleteGroupRequest(ctx, { groupId });
    const removeResponse = await fetch(remove.url, {
      ...remove.init,
      signal: AbortSignal.timeout(10_000),
    });
    expect(removeResponse.ok).toBe(true);
    expect(parseDeleteGroupResponse(await removeResponse.json())).toBe(true);
  });
});
