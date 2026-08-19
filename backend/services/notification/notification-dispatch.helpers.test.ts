import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications";
import { UserRepository } from "@/backend/db/repo/users";
import { AccountStatus, NotificationChannel, NotificationEventType } from "@/backend/enum";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import {
  dispatchWithPreferences,
  EVENT_CHANNEL_ALLOWLIST,
} from "@/backend/services/notification/notification-dispatch.helpers";
import type {
  ChannelDispatchResult,
  CommunicationPayload,
  UserNotificationPreferenceSelectType,
  UserSelectType,
} from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

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

function buildFourChannelPayloads(
  userId: string,
  eventType: NotificationEventType,
  title = "test-title",
  body = "test-body"
): CommunicationPayload[] {
  return [
    { userId, channel: NotificationChannel.ON_APP, eventType, title, body },
    { userId, channel: NotificationChannel.EMAIL, eventType, title, body },
    { userId, channel: NotificationChannel.SMS, eventType, title, body },
    { userId, channel: NotificationChannel.PUSH, eventType, title, body },
  ];
}

function successResult(channel: CommunicationPayload["channel"]): ChannelDispatchResult {
  return { channel, success: true, providerMessageId: `pmid-${channel}` };
}

let getByUserIdsSpy: ReturnType<typeof spyOn>;
let dispatchMultiSpy: ReturnType<typeof spyOn>;
let findSafeByIdsSpy: ReturnType<typeof spyOn>;

type ContactOverrides = { email?: string; phone?: string | null };

function mockUser(overrides?: ContactOverrides): UserSelectType {
  const id = crypto.randomUUID();
  const now = new Date();
  const base: UserSelectType = {
    id,
    name: "Test User",
    email: overrides?.email ?? "test@example.com",
    emailVerifiedAt: null,
    password: crypto.randomUUID(),
    rememberTokenHash: null,
    avatarFilePath: null,
    avatarUrl: null,
    phone: "+15555550100",
    status: AccountStatus.ACTIVATED,
    isSuperAdmin: false,
    timezone: IanaTimezone.UTC,
    displayCurrency: null,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  return Object.assign(base, overrides);
}

function mockFindSafeByIdsWithUser(userOverrides?: ContactOverrides) {
  findSafeByIdsSpy.mockImplementation(async (ids: string[]) => {
    const map = new Map<string, UserSelectType | null>();
    for (const id of ids) {
      map.set(id, mockUser(userOverrides));
    }
    return map;
  });
}

function getDispatchedPayloads(callIndex = 0): CommunicationPayload[] {
  // `mock.calls` is untyped (any). Centralizing the typed access removes the need
  // for repeated `as` assertions throughout the tests.
  return dispatchMultiSpy.mock.calls[callIndex][0];
}

async function dispatchAndGetResults(userId: string, eventType: NotificationEventType) {
  const payloads = buildFourChannelPayloads(userId, eventType);
  await dispatchWithPreferences(payloads, [userId]);
  return getDispatchedPayloads();
}

beforeEach(() => {
  getByUserIdsSpy = spyOn(NotificationPreferencesRepository, "getByUserIds").mockResolvedValue(new Map());
  dispatchMultiSpy = spyOn(CommunicationService, "dispatchMulti").mockImplementation(
    async (payloads: CommunicationPayload[]): Promise<ChannelDispatchResult[]> =>
      payloads.map(p => successResult(p.channel))
  );
  findSafeByIdsSpy = spyOn(UserRepository, "findSafeByIds").mockImplementation(
    async (ids: string[]): Promise<Map<string, UserSelectType | null>> => {
      const map = new Map<string, UserSelectType | null>();
      for (const id of ids) {
        map.set(id, mockUser());
      }
      return map;
    }
  );
});

afterEach(() => {
  getByUserIdsSpy.mockRestore();
  dispatchMultiSpy.mockRestore();
  findSafeByIdsSpy.mockRestore();
});

describe("dispatchWithPreferences — preferences filtering", () => {
  test("empty payloads early-return [] without contacting the prefs repo or dispatchMulti", async () => {
    const results = await dispatchWithPreferences([], [PARENT_USER_ID]);

    expect(results).toEqual([]);
    expect(getByUserIdsSpy).not.toHaveBeenCalled();
    expect(dispatchMultiSpy).not.toHaveBeenCalled();
  });

  test("empty affectedUserIds early-return [] without contacting the prefs repo or dispatchMulti", async () => {
    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.CLASS_REMINDER);
    const results = await dispatchWithPreferences(payloads, []);

    expect(results).toEqual([]);
    expect(getByUserIdsSpy).not.toHaveBeenCalled();
    expect(dispatchMultiSpy).not.toHaveBeenCalled();
  });

  test("user with all-enabled prefs → all 4 channel payloads reach dispatchMulti", async () => {
    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);
    const results = await dispatchWithPreferences(payloads, [PARENT_USER_ID], "en");

    expect(results).toHaveLength(4);
    expect(results.every(r => r.success)).toBe(true);
    expect(getByUserIdsSpy).toHaveBeenCalledTimes(1);
    expect(getByUserIdsSpy).toHaveBeenCalledWith([PARENT_USER_ID]);
    expect(dispatchMultiSpy).toHaveBeenCalledTimes(1);
    const dispatched = getDispatchedPayloads();
    expect(dispatched).toHaveLength(4);
    const dispatchedChannels = dispatched.map(p => p.channel).toSorted(compareChannels);
    expect(dispatchedChannels).toEqual([
      NotificationChannel.EMAIL,
      NotificationChannel.ON_APP,
      NotificationChannel.PUSH,
      NotificationChannel.SMS,
    ]);
  });

  test("user disabling EMAIL for INVOICE_GENERATED → email payload is filtered out", async () => {
    getByUserIdsSpy.mockResolvedValue(
      new Map([
        [
          PARENT_USER_ID,
          [prefRow(PARENT_USER_ID, NotificationChannel.EMAIL, NotificationEventType.INVOICE_GENERATED, false)],
        ],
      ])
    );

    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);
    const results = await dispatchWithPreferences(payloads, [PARENT_USER_ID]);

    expect(results).toHaveLength(3);
    const dispatchedChannels = getDispatchedPayloads()
      .map(p => p.channel)
      .toSorted(compareChannels);
    expect(dispatchedChannels).toEqual([NotificationChannel.ON_APP, NotificationChannel.PUSH, NotificationChannel.SMS]);
    expect(dispatchedChannels).not.toContain(NotificationChannel.EMAIL);
    expect(results.every(r => r.success)).toBe(true);
  });

  test("EVENT_CHANNEL_ALLOWLIST filters CLASS_SCHEDULED payloads to ON_APP + EMAIL BEFORE the prefs filter", async () => {
    const allowed = EVENT_CHANNEL_ALLOWLIST[NotificationEventType.CLASS_SCHEDULED] ?? [];
    const allowedLower = allowed.map(c =>
      c === NotificationChannel.ON_APP ? NotificationChannel.ON_APP : NotificationChannel.EMAIL
    );
    expect([...allowedLower].toSorted(compareChannels)).toEqual([
      NotificationChannel.EMAIL,
      NotificationChannel.ON_APP,
    ]);

    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.CLASS_SCHEDULED);
    const results = await dispatchWithPreferences(payloads, [PARENT_USER_ID]);

    expect(results).toHaveLength(2);
    const dispatched = getDispatchedPayloads();
    expect(dispatched).toHaveLength(2);
    const dispatchedChannels = dispatched.map(p => p.channel).toSorted(compareChannels);
    expect(dispatchedChannels).toEqual([NotificationChannel.EMAIL, NotificationChannel.ON_APP]);
  });

  test("prefs batch fetch error propagates — dispatchMulti is not called", async () => {
    getByUserIdsSpy.mockRejectedValue(new Error("prefs DB unreachable"));

    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);

    // Use explicit try/catch to assert the error so static analyzers do not warn about
    // awaiting non-Promise types on the `expect(...).rejects` helper.
    let caughtErr: Error | undefined;
    try {
      await dispatchWithPreferences(payloads, [PARENT_USER_ID]);
      throw new Error("Expected dispatchWithPreferences to throw");
    } catch (err) {
      if (err instanceof Error) {
        caughtErr = err;
      }
    }
    expect(caughtErr).toBeDefined();
    expect(caughtErr?.message).toContain("prefs DB unreachable");
    expect(getByUserIdsSpy).toHaveBeenCalledTimes(1);
    expect(dispatchMultiSpy).not.toHaveBeenCalled();
  });

  test("two affected users — each gets their own dispatchMulti call with their prefs applied", async () => {
    getByUserIdsSpy.mockResolvedValue(
      new Map([
        [
          TEACHER_USER_ID,
          [prefRow(TEACHER_USER_ID, NotificationChannel.EMAIL, NotificationEventType.CLASS_REMINDER, false)],
        ],
      ])
    );

    const payloads: CommunicationPayload[] = [
      ...buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.CLASS_REMINDER),
      ...buildFourChannelPayloads(TEACHER_USER_ID, NotificationEventType.CLASS_REMINDER),
    ];

    const results = await dispatchWithPreferences(payloads, [PARENT_USER_ID, TEACHER_USER_ID]);

    expect(results).toHaveLength(7);
    expect(getByUserIdsSpy).toHaveBeenCalledTimes(1);
    expect(getByUserIdsSpy).toHaveBeenCalledWith([PARENT_USER_ID, TEACHER_USER_ID]);
    expect(dispatchMultiSpy).toHaveBeenCalledTimes(2);

    const firstCallPayloads = getDispatchedPayloads(0);
    const secondCallPayloads = getDispatchedPayloads(1);
    expect(firstCallPayloads).toHaveLength(4);
    expect(secondCallPayloads).toHaveLength(3);
    expect(secondCallPayloads.map(p => p.channel)).not.toContain(NotificationChannel.EMAIL);
  });
});

describe("dispatchWithPreferences — recipient resolution", () => {
  test("stamps `metadata.to` with user.email on email payloads before dispatchMulti", async () => {
    mockFindSafeByIdsWithUser({ email: "[EMAIL_REDACTED]" });
    const dispatched = await dispatchAndGetResults(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);

    expect(findSafeByIdsSpy).toHaveBeenCalledWith([PARENT_USER_ID]);
    const emailPayload = dispatched.find(p => p.channel === NotificationChannel.EMAIL);
    expect(emailPayload?.metadata?.to).toBe("[EMAIL_REDACTED]");
  });

  test("stamps `metadata.to` with user.phone on sms payloads before dispatchMulti", async () => {
    mockFindSafeByIdsWithUser({ phone: "+[PHONE_REDACTED]" });
    const dispatched = await dispatchAndGetResults(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);

    const smsPayload = dispatched.find(p => p.channel === NotificationChannel.SMS);
    expect(smsPayload?.metadata?.to).toBe("+[PHONE_REDACTED]");
  });

  test("drops email payload when user.email is empty (no email payload reaches dispatchMulti)", async () => {
    mockFindSafeByIdsWithUser({ email: "" });
    const dispatched = await dispatchAndGetResults(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);

    expect(dispatched.map(p => p.channel)).not.toContain(NotificationChannel.EMAIL);
    expect(dispatched.map(p => p.channel).toSorted(compareChannels)).toEqual([
      NotificationChannel.ON_APP,
      NotificationChannel.PUSH,
      NotificationChannel.SMS,
    ]);
  });

  test("drops sms payload when user.phone is null", async () => {
    mockFindSafeByIdsWithUser({ phone: null });
    const dispatched = await dispatchAndGetResults(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);

    expect(dispatched.map(p => p.channel)).not.toContain(NotificationChannel.SMS);
    expect(dispatched.map(p => p.channel).toSorted(compareChannels)).toEqual([
      NotificationChannel.EMAIL,
      NotificationChannel.ON_APP,
      NotificationChannel.PUSH,
    ]);
  });

  test("drops all email+sms payloads when user not found, still dispatches on_app+push", async () => {
    findSafeByIdsSpy.mockResolvedValue(new Map([[PARENT_USER_ID, null]]));

    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);
    await dispatchWithPreferences(payloads, [PARENT_USER_ID]);

    const dispatched = getDispatchedPayloads();
    expect(dispatched.map(p => p.channel).toSorted(compareChannels)).toEqual([
      NotificationChannel.ON_APP,
      NotificationChannel.PUSH,
    ]);
    expect(dispatched).toHaveLength(2);
  });

  test("logger.warn includes channel type when contactless payloads are dropped", async () => {
    findSafeByIdsSpy.mockResolvedValue(new Map([[PARENT_USER_ID, null]]));
    const { logger } = await import("@/backend/lib/logger");
    const warnSpy = spyOn(logger, "warn");

    const payloads = buildFourChannelPayloads(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);
    await dispatchWithPreferences(payloads, [PARENT_USER_ID]);

    const droppedWarn = warnSpy.mock.calls.find(
      (call: unknown[]) => typeof call[0] === "string" && call[0].includes("dropped contactless payloads")
    );
    expect(droppedWarn).toBeDefined();
    const ctx = droppedWarn?.[1];
    if (ctx !== null && typeof ctx === "object" && "droppedByChannel" in ctx) {
      const droppedByChannel = ctx.droppedByChannel;
      if (typeof droppedByChannel === "object" && droppedByChannel !== null) {
        expect(droppedByChannel).toHaveProperty("EMAIL");
        expect(droppedByChannel).toHaveProperty("SMS");
      } else {
        throw new Error("Expected droppedByChannel to be an object");
      }
    } else {
      throw new Error("Expected warn call to have a context object with droppedByChannel");
    }

    warnSpy.mockRestore();
  });

  test("does NOT stamp `to` on on_app or push payloads", async () => {
    mockFindSafeByIdsWithUser({ email: "[EMAIL_REDACTED]", phone: "+[PHONE_REDACTED]" });
    const dispatched = await dispatchAndGetResults(PARENT_USER_ID, NotificationEventType.INVOICE_GENERATED);

    const onAppPayload = dispatched.find(p => p.channel === NotificationChannel.ON_APP);
    const pushPayload = dispatched.find(p => p.channel === NotificationChannel.PUSH);
    expect(onAppPayload?.metadata?.to).toBeUndefined();
    expect(pushPayload?.metadata?.to).toBeUndefined();
  });
});
