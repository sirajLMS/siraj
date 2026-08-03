/**
 * Zoom meeting adapter — single live smoke test (one API round-trip).
 *
 * Creates one real Zoom meeting via the adapter, asserts the join URL,
 * then deletes it via the adapter's deleteMeeting method.
 *
 * Prerequisites (env vars in .env.test):
 *   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
 *
 * Run: `bun run test:integration` or
 *      `bun --env-file=.env.test test test/integration/meeting/zoom.integration.test.ts`
 */
import { expect, test } from "bun:test";
import { ZoomMeetingAdapter } from "@/backend/services/meeting/channels/zoom/ZoomMeetingAdapter";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const hasZoomConfig = Boolean(
  process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET
);

const describeLive = describeLiveWhen(hasZoomConfig, "ZoomMeetingAdapter @live-meeting");

describeLive("ZoomMeetingAdapter @live-meeting", () => {
  test("validateConfig + generateMeeting + deleteMeeting (full round-trip)", async () => {
    const adapter = new ZoomMeetingAdapter({
      accountId: process.env.ZOOM_ACCOUNT_ID,
      clientId: process.env.ZOOM_CLIENT_ID,
      clientSecret: process.env.ZOOM_CLIENT_SECRET,
    });

    // 1. Validate config
    expect(await adapter.validateConfig()).toBe(true);

    // 2. Generate meeting
    const result = await adapter.generateMeeting({
      topic: "[Test] Siraj smoke - safe to delete",
      durationMinutes: 15,
    });

    expect(result.joinUrl).toBeTruthy();
    expect(result.joinUrl).toMatch(/^https:\/\/zoom\.us\/j\//);
    expect(result.meetingId).toBeTruthy();
    const meetingId = result.meetingId ?? "";

    testLogger.info("Zoom smoke: meeting created", {
      meetingId,
      joinUrl: result.joinUrl,
    });

    // 3. Delete meeting via adapter.deleteMeeting
    await adapter.deleteMeeting(meetingId);
    testLogger.info("Zoom smoke: meeting deleted", { meetingId });

    // 4. Health check — config still valid after operations
    expect(await adapter.validateConfig()).toBe(true);

    await adapter.disconnect();
  });
});
