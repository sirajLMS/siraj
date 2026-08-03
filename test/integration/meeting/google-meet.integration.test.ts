/**
 * Google Meet adapter — single live smoke test (one API round-trip).
 *
 * Creates one real Google Meet space via the adapter and asserts the
 * meeting URI. The Google Meet API has no per-space DELETE endpoint;
 * the space auto-expires after the meeting ends, so there is no cleanup.
 *
 * Prerequisites (env vars in .env.test):
 *   GOOGLE_MEET_SERVICE_ACCOUNT_JSON, GOOGLE_MEET_IMPERSONATE_SUBJECT
 *
 * Run: `bun run test:integration` or
 *      `bun --env-file=.env.test test test/integration/meeting/google-meet.integration.test.ts`
 */
import { expect, test } from "bun:test";
import { GoogleMeetAdapter } from "@/backend/services/meeting/channels/google-meet/GoogleMeetAdapter";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const hasGoogleMeetConfig = Boolean(
  process.env.GOOGLE_MEET_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_MEET_IMPERSONATE_SUBJECT
);

const describeLive = describeLiveWhen(hasGoogleMeetConfig, "GoogleMeetAdapter @live-meeting");

describeLive("GoogleMeetAdapter @live-meeting", () => {
  test("validateConfig + generateMeeting (no delete — Meet API has no per-space DELETE)", async () => {
    const adapter = new GoogleMeetAdapter({
      serviceAccountJson: process.env.GOOGLE_MEET_SERVICE_ACCOUNT_JSON,
      impersonateSubject: process.env.GOOGLE_MEET_IMPERSONATE_SUBJECT,
    });

    // 1. Validate config
    expect(await adapter.validateConfig()).toBe(true);

    // 2. Generate meeting (creates a Meet space)
    const result = await adapter.generateMeeting({
      topic: "[Test] Siraj smoke - safe to delete",
      durationMinutes: 15,
    });

    expect(result.joinUrl).toBeTruthy();
    expect(result.joinUrl).toMatch(/^https:\/\/meet\.google\.com\//);
    expect(result.meetingId).toBeTruthy();

    testLogger.info("Google Meet smoke: space created", {
      meetingId: result.meetingId,
      joinUrl: result.joinUrl,
      providerMetadata: result.providerMetadata,
    });

    // 3. Delete — Meet API has no per-space DELETE; the space auto-expires after the meeting ends.
    testLogger.info("Google Meet smoke: no delete performed — Meet API has no per-space DELETE; space auto-expires", {
      meetingId: result.meetingId,
    });

    // 4. Health check — config still valid after operations
    expect(await adapter.validateConfig()).toBe(true);

    await adapter.disconnect();
  });
});
