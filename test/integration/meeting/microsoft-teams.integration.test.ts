/**
 * Microsoft Teams adapter — single live smoke test (one API round-trip).
 *
 * Creates one real online meeting via the adapter, asserts the joinWebUrl,
 * then deletes it via the adapter's deleteMeeting method.
 *
 * Prerequisites (env vars in .env.test):
 *   MS_TEAMS_TENANT_ID, MS_TEAMS_CLIENT_ID, MS_TEAMS_CLIENT_SECRET,
 *   MS_TEAMS_ORGANIZER_USER_ID
 *
 * The test tenant must have an application access policy assigned to the
 * organizer user via PowerShell:
 *   New-CsApplicationAccessPolicy -Identity TestAppAccessPolicy -AppIds "<client-id>"
 *   Grant-CsApplicationAccessPolicy -Identity "<organizer-upn>" -PolicyName TestAppAccessPolicy
 *
 * Run: `bun run test:integration` or
 *      `bun --env-file=.env.test test test/integration/meeting/microsoft-teams.integration.test.ts`
 */
import { expect, test } from "bun:test";
import { MicrosoftTeamsAdapter } from "@/backend/services/meeting/channels/microsoft-teams/MicrosoftTeamsAdapter";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const hasMicrosoftTeamsConfig = Boolean(
  process.env.MS_TEAMS_TENANT_ID &&
    process.env.MS_TEAMS_CLIENT_ID &&
    process.env.MS_TEAMS_CLIENT_SECRET &&
    process.env.MS_TEAMS_ORGANIZER_USER_ID
);

const describeLive = describeLiveWhen(hasMicrosoftTeamsConfig, "MicrosoftTeamsAdapter @live-meeting");

describeLive("MicrosoftTeamsAdapter @live-meeting", () => {
  test("validateConfig + generateMeeting + deleteMeeting (full round-trip)", async () => {
    const adapter = new MicrosoftTeamsAdapter({
      tenantId: process.env.MS_TEAMS_TENANT_ID,
      clientId: process.env.MS_TEAMS_CLIENT_ID,
      clientSecret: process.env.MS_TEAMS_CLIENT_SECRET,
      organizerUserId: process.env.MS_TEAMS_ORGANIZER_USER_ID,
    });

    // 1. Validate config
    expect(await adapter.validateConfig()).toBe(true);

    // 2. Generate meeting
    const result = await adapter.generateMeeting({
      topic: "[Test] Siraj smoke - safe to delete",
      durationMinutes: 15,
    });

    expect(result.joinUrl).toBeTruthy();
    expect(result.joinUrl).toMatch(/^https:\/\/teams\.microsoft\.com\//);
    expect(result.meetingId).toBeTruthy();
    const meetingId = result.meetingId ?? "";

    testLogger.info("Teams smoke: meeting created", {
      meetingId,
      joinUrl: result.joinUrl,
    });

    // 3. Delete meeting via the adapter's deleteMeeting method
    await adapter.deleteMeeting(meetingId);
    testLogger.info("Teams smoke: meeting deleted", { meetingId });

    // 4. Health check — config still valid after operations
    expect(await adapter.validateConfig()).toBe(true);

    await adapter.disconnect();
  });
});
