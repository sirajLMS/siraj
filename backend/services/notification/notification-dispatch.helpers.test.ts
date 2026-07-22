import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationPreferencesRepository } from "@/backend/db/repo";
import { NotificationChannel, NotificationEventType } from "@/backend/enum";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import {
  dispatchWithPreferences,
  EVENT_CHANNEL_ALLOWLIST,
} from "@/backend/services/notification/notification-dispatch.helpers";
import type { ChannelDispatchResult, CommunicationPayload } from "@/backend/types";
import type { UserNotificationPreferenceSelectType } from "@/backend/types/users/userNotificationPreferences.types";

// ─── Test fixtures ─────────────────────────────────────────────────────

const PARENT_USER_ID = "00000000-0000-0000-0000-000000000001";
const TEACHER_USER_ID = "00000000-0000-0000-0000-000000000002";

const compareChannels = (a: string, b: string): number => a.localeCompare(b);

type PrefRow = Pick<
  UserNotificationPreferenceSelectType,
  "id" | "userId" | "channel" | "eventType" | "enabled" | "createdAt" | "updatedAt"
>;

function prefRow(
  userId: string,
  channel: NotificationChannel,
  eventType: NotificationEventType,
  enabled: boolean
): PrefRow {
  return {
    id: `pref-${userId}-${channel}-${eventType}`,
    userId,
    channel,
    eventType,
    enabled,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Build a 4-channel payload set for a single user/event — mirrors what the
 * pure builder `buildClassLifecyclePayloads` produces for one (user, eventType)
 * pair (one `CommunicationPayload` per channel × 4 channels).
 */
function buildFourChannelPayloads(
  userId: string,
  eventType: NotificationEventType,
  title = "test-title",
  body = "test-body"
): CommunicationPayload[] {
  return [
    { userId, channel: "on_app", eventType, title, body },
    { userId, channel: "email", eventType, title, body },
    { userId, channel: "sms", eventType, title, body },
    { userId, channel: "push", eventType, title, body },
  ];
}

function successResult(channel: CommunicationPayload["channel"]): ChannelDispatchResult {
  return { channel, success: true, providerMessageId: `pmid-${channel}` };
}

// ─── Spies ─────────────────────────────────────────────────────────────

let getByUserIdSpy: ReturnType<typeof spyOn>;
let dispatchMultiSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  // Default: user has NO stored prefs → helper treats them as "all enabled".
  getByUserIdSpy = spyOn(NotificationPreferencesRepository, "getByUserId").mockResolvedValue([]);
  // Default: dispatchMulti returns one success per payload (mirrors the real
  // CommunicationService.dispatchMulti fan-out map).
  dispatchMultiSpy = spyOn(CommunicationService, "dispatchMulti").mockImplementation(
    async (payloads: CommunicationPayload[]): Promise<ChannelDispatchResult[]> =>
      payloads.map(p => successResult(p.channel))
  );
});

afterEach(() => {
  getByUserIdSpy.mockRestore();
  dispatchMultiSpy.mockRestore();
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe("dispatchWithPreferences — preferences filtering", () => {
  test("empty payloads early-return [] without contacting the prefs repo or dispatchMulti", async () => {
    const results = await dispatchWithPreferences([], [PARENT_USER_ID]);

    expect(results).toEqual([]);
    expect(getByUserIdSpy).not.toHaveBeenCalled();
    expect(dispatchMultiSpy).not.toHaveBeenCalled();
  });

  test("empty affectedUserIds early-return [] without contacting the prefs repo or dispatchMulti", async () => {
    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.CLASS_REMINDER);
    const results = await dispatchWithPreferences(payloads, []);

    expect(results).toEqual([]);
    expect(getByUserIdSpy).not.toHaveBeenCalled();
    expect(dispatchMultiSpy).not.toHaveBeenCalled();
  });

  test("user with all-enabled prefs → all 4 channel payloads reach dispatchMulti", async () => {
    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);
    const results = await dispatchWithPreferences(payloads, [PARENT_USER_ID], "en");

    expect(results).toHaveLength(4);
    expect(results.every(r => r.success)).toBe(true);
    expect(getByUserIdSpy).toHaveBeenCalledTimes(1);
    expect(getByUserIdSpy).toHaveBeenCalledWith(PARENT_USER_ID);
    expect(dispatchMultiSpy).toHaveBeenCalledTimes(1);
    const dispatched = dispatchMultiSpy.mock.calls[0][0] as CommunicationPayload[];
    expect(dispatched).toHaveLength(4);
    const dispatchedChannels = dispatched.map(p => p.channel).sort(compareChannels);
    expect(dispatchedChannels).toEqual(["email", "on_app", "push", "sms"]);
  });

  test("user disabling EMAIL for INVOICE_GENERATED → email payload is filtered out", async () => {
    getByUserIdSpy.mockResolvedValue([
      prefRow(PARENT_USER_ID, NotificationChannel.EMAIL, NotificationEventType.INVOICE_GENERATED, false),
    ]);

    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);
    const results = await dispatchWithPreferences(payloads, [PARENT_USER_ID]);

    // 3 of 4 channels survive the prefs filter for this single user.
    expect(results).toHaveLength(3);
    const dispatchedChannels = (dispatchMultiSpy.mock.calls[0][0] as CommunicationPayload[])
      .map(p => p.channel)
      .sort(compareChannels);
    expect(dispatchedChannels).toEqual(["on_app", "push", "sms"]);
    expect(dispatchedChannels).not.toContain("email");
    expect(results.every(r => r.success)).toBe(true);
  });

  test("EVENT_CHANNEL_ALLOWLIST filters CLASS_SCHEDULED payloads to ON_APP + EMAIL BEFORE the prefs filter", async () => {
    // Sanity: the allowlist entry is exactly ON_APP + EMAIL for CLASS_SCHEDULED.
    const allowed = EVENT_CHANNEL_ALLOWLIST[NotificationEventType.CLASS_SCHEDULED] ?? [];
    const allowedLower = allowed.map(c => (c === NotificationChannel.ON_APP ? "on_app" : "email"));
    expect([...allowedLower].sort(compareChannels)).toEqual(["email", "on_app"]);

    // Even though user has ALL prefs enabled, only ON_APP + EMAIL may dispatch.
    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.CLASS_SCHEDULED);
    const results = await dispatchWithPreferences(payloads, [PARENT_USER_ID]);

    expect(results).toHaveLength(2);
    const dispatched = dispatchMultiSpy.mock.calls[0][0] as CommunicationPayload[];
    expect(dispatched).toHaveLength(2);
    const dispatchedChannels = dispatched.map(p => p.channel).sort(compareChannels);
    expect(dispatchedChannels).toEqual(["email", "on_app"]);
  });

  test("prefs fetch error falls back to all-enabled — dispatchMulti still receives all 4 channels", async () => {
    // Simulate `NotificationPreferencesRepository.getByUserId` rejecting for
    // the user. Per specs.md §5.2 the helper must NOT poison the dispatch —
    // it logs a warn and treats the user as all-enabled (safe over-notify).
    getByUserIdSpy.mockRejectedValue(new Error("prefs DB unreachable"));

    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);
    const results = await dispatchWithPreferences(payloads, [PARENT_USER_ID]);

    expect(getByUserIdSpy).toHaveBeenCalledTimes(1);
    expect(dispatchMultiSpy).toHaveBeenCalledTimes(1);
    const dispatched = dispatchMultiSpy.mock.calls[0][0] as CommunicationPayload[];
    expect(dispatched).toHaveLength(4);
    expect(dispatched.map(p => p.channel).sort(compareChannels)).toEqual(["email", "on_app", "push", "sms"]);
    expect(results).toHaveLength(4);
    expect(results.every(r => r.success)).toBe(true);
  });

  test("two affected users — each gets their own dispatchMulti call with their prefs applied", async () => {
    // Parent: all enabled. Teacher: EMAIL disabled for CLASS_REMINDER.
    getByUserIdSpy.mockImplementation((userId: string) => {
      if (userId === TEACHER_USER_ID) {
        return Promise.resolve([
          prefRow(TEACHER_USER_ID, NotificationChannel.EMAIL, NotificationEventType.CLASS_REMINDER, false),
        ] as unknown as UserNotificationPreferenceSelectType[]);
      }
      return Promise.resolve([] as unknown as UserNotificationPreferenceSelectType[]);
    });

    const payloads: CommunicationPayload[] = [
      ...buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.CLASS_REMINDER),
      ...buildFourChannelPayloads(TEACHER_USER_ID, NotificationEventType.CLASS_REMINDER),
    ];

    const results = await dispatchWithPreferences(payloads, [PARENT_USER_ID, TEACHER_USER_ID]);

    // Parent: 4 channels. Teacher: 3 channels (email filtered). Total 7.
    expect(results).toHaveLength(7);
    expect(getByUserIdSpy).toHaveBeenCalledTimes(2);
    expect(dispatchMultiSpy).toHaveBeenCalledTimes(2);

    const firstCallPayloads = dispatchMultiSpy.mock.calls[0][0] as CommunicationPayload[];
    const secondCallPayloads = dispatchMultiSpy.mock.calls[1][0] as CommunicationPayload[];
    expect(firstCallPayloads).toHaveLength(4);
    expect(secondCallPayloads).toHaveLength(3);
    expect(secondCallPayloads.map(p => p.channel)).not.toContain("email");
  });
});
