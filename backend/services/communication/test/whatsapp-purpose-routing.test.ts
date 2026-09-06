import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications";
import { UserRepository } from "@/backend/db/repo/users";
import { AccountStatus, NotificationChannel, NotificationEventType } from "@/backend/enum";
import { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { WHATSAPP_NO_SENDER_FOR_PURPOSE_CODE } from "@/backend/lib/errors";
import type { CommunicationPayload, UserSelectType } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

const USER_ID = "user-test-0001";
const ACCOUNT_STUDENTS = "acct-students";
const ACCOUNT_GENERAL = "acct-general";
const RECIPIENT = "15555501234";

function mockUser(): UserSelectType {
  const now = new Date();
  return {
    id: USER_ID,
    name: "Test User",
    email: "u@example.invalid",
    emailVerifiedAt: null,
    password: "hash",
    rememberTokenHash: null,
    avatarFilePath: null,
    avatarUrl: null,
    phone: RECIPIENT,
    status: AccountStatus.ACTIVATED,
    isSuperAdmin: false,
    timezone: IanaTimezone.UTC,
    displayCurrency: null,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

interface SentCall {
  readonly payload: Record<string, unknown>;
}

const sendLog: SentCall[] = [];
let nextResolution: { accountId: string; purposeArg?: unknown } | null = {
  accountId: ACCOUNT_STUDENTS,
};

const getChannelForPurposeMock = mock(async () => {
  if (!nextResolution) return null;
  return {
    accountId: nextResolution.accountId,
    channel: {
      send: async (payload: Record<string, unknown>) => {
        sendLog.push({ payload });
        return { success: true, providerMessageId: "wamid-test-1", sendAttempted: true };
      },
      validateConfig: async () => true,
      disconnect: async () => {},
    },
  };
});

// __MOCKS__

void mock.module("@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory", () => ({
  getChannelForPurpose: getChannelForPurposeMock,
  getWhatsappChannel: async () => ({
    send: async () => ({ success: true }),
    validateConfig: async () => true,
    disconnect: async () => {},
  }),
  validateWhatsappChannelConfig: async () => true,
  resetWhatsappChannel: async () => {},
  whatsappChannel: {
    send: async () => ({ success: true }),
    validateConfig: async () => true,
    disconnect: async () => {},
  },
}));

async function importDispatch() {
  return import("@/backend/services/communication/communication.service");
}

async function importDispatchHelpers() {
  return import("@/backend/services/notification/notification-dispatch.helpers");
}

function whatsappPayload(overrides: { purpose?: unknown; metadata?: Record<string, unknown> }): CommunicationPayload {
  return {
    userId: USER_ID,
    channel: NotificationChannel.WHATSAPP,
    eventType: NotificationEventType.LESSON_REPORT_REVIEWED,
    title: "t",
    body: "b",
    metadata: {
      to: RECIPIENT,
      whatsappTemplate: {
        name: "lesson_tpl",
        languageCode: "en",
        paramsOrder: [],
        ...(overrides.purpose === undefined
          ? { purpose: WhatsappAccountPurpose.STUDENTS }
          : { purpose: overrides.purpose }),
      },
      ...overrides.metadata,
    },
  };
}

describe("dispatchWhatsapp — purpose routing", () => {
  beforeEach(() => {
    sendLog.length = 0;
    nextResolution = { accountId: ACCOUNT_STUDENTS };
    getChannelForPurposeMock.mockClear();
    spyOn(NotificationPreferencesRepository, "getByUserIds").mockResolvedValue(new Map());
    spyOn(UserRepository, "findSafeByIds").mockImplementation(async (ids: string[]) => {
      const map = new Map<string, UserSelectType | null>();
      for (const id of ids) {
        map.set(id, mockUser());
      }
      return map;
    });
  });

  test("routes a STUDENTS-purpose template to the purpose account", async () => {
    const { CommunicationService } = await importDispatch();
    const result = await CommunicationService.dispatch(whatsappPayload({}), "en");

    expect(getChannelForPurposeMock).toHaveBeenCalledWith(WhatsappAccountPurpose.STUDENTS);
    expect(result.success).toBe(true);
    expect(result.providerMessageId).toBe("wamid-test-1");
    expect(sendLog).toHaveLength(1);
    const sent = sendLog[0].payload;
    expect(sent.senderAccountId).toBe(ACCOUNT_STUDENTS);
    expect(sent.purpose).toBe(WhatsappAccountPurpose.STUDENTS);
  });

  test("defaults to GENERAL when the template carries no purpose", async () => {
    const { CommunicationService } = await importDispatch();
    const base = whatsappPayload({});
    const payload: CommunicationPayload = {
      ...base,
      metadata: {
        ...base.metadata,
        whatsappTemplate: { name: "lesson_tpl", languageCode: "en" },
      },
    };
    await CommunicationService.dispatch(payload, "en");

    expect(getChannelForPurposeMock).toHaveBeenCalledWith(WhatsappAccountPurpose.GENERAL);
  });

  test("deactivated purpose falls back to the GENERAL account resolution", async () => {
    nextResolution = { accountId: ACCOUNT_GENERAL };
    const { CommunicationService } = await importDispatch();
    const result = await CommunicationService.dispatch(whatsappPayload({}), "en");

    expect(result.success).toBe(true);
    expect(sendLog[0].payload.senderAccountId).toBe(ACCOUNT_GENERAL);
  });

  test("fails fast with whatsapp.noSenderForPurpose when no account resolves", async () => {
    nextResolution = null;
    const { CommunicationService } = await importDispatch();
    const result = await CommunicationService.dispatch(whatsappPayload({}), "en");

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(WHATSAPP_NO_SENDER_FOR_PURPOSE_CODE);
    expect(result.sendAttempted).toBe(false);
    expect(sendLog).toHaveLength(0);
  });

  test("an unknown purpose string invalidates the template metadata guard", async () => {
    nextResolution = { accountId: ACCOUNT_GENERAL };
    const { CommunicationService } = await importDispatch();
    const result = await CommunicationService.dispatch(whatsappPayload({ purpose: "BOGUS" }), "en");

    expect(result.success).toBe(false);
    expect(result.errorCode).toBeUndefined();
    expect(getChannelForPurposeMock).not.toHaveBeenCalled();
    expect(sendLog).toHaveLength(0);
  });

  test("delivery-row metadata is attributed to the resolved sender account", async () => {
    const { CommunicationService } = await importDispatch();
    const payload = whatsappPayload({
      metadata: { entityKind: "invoice", entityId: "inv-1" },
    });
    const result = await CommunicationService.dispatch(payload, "en");

    expect(result.success).toBe(true);
    const metadata: unknown = sendLog[0].payload.metadata;
    const senderAccountId = metadata && typeof metadata === "object" ? Reflect.get(metadata, "senderAccountId") : null;
    const entityId = metadata && typeof metadata === "object" ? Reflect.get(metadata, "entityId") : null;
    expect(senderAccountId).toBe(ACCOUNT_STUDENTS);
    expect(entityId).toBe("inv-1");
  });

  test("dispatchWithPreferences carries whatsappTemplate purpose through untouched", async () => {
    const { dispatchWithPreferences } = await importDispatchHelpers();
    const routedPayload: CommunicationPayload = {
      ...whatsappPayload({}),
      eventType: NotificationEventType.CLASS_REMINDER,
    };
    const results = await dispatchWithPreferences([routedPayload], [USER_ID], "en");

    expect(getChannelForPurposeMock).toHaveBeenCalledWith(WhatsappAccountPurpose.STUDENTS);
    const whatsappResult = results.find(r => r.channel === NotificationChannel.WHATSAPP);
    expect(whatsappResult?.success).toBe(true);
    expect(sendLog).toHaveLength(1);
  });
});

describe("NOTIFICATION_TEMPLATE_MAP purposes", () => {
  test("every mapped event routes to the STUDENTS purpose", async () => {
    const { NOTIFICATION_TEMPLATE_MAP } = await import(
      "@/backend/services/notification/notification-payloads.builders"
    );
    const expected: ReadonlyArray<readonly [NotificationEventType]> = [
      [NotificationEventType.CLASS_REMINDER],
      [NotificationEventType.CLASS_ACTIVATED],
      [NotificationEventType.LESSON_REPORT_SUBMITTED],
      [NotificationEventType.LESSON_REPORT_REVIEWED],
      [NotificationEventType.INVOICE_GENERATED],
    ];
    for (const [eventType] of expected) {
      expect(NOTIFICATION_TEMPLATE_MAP[eventType]?.purpose).toBe(WhatsappAccountPurpose.STUDENTS);
    }
  });

  test("builders stamp template purpose into whatsapp payload metadata", async () => {
    const { buildLessonReportSubmittedPayloads } = await import(
      "@/backend/services/notification/notification-payloads.builders"
    );
    const payloads = buildLessonReportSubmittedPayloads("report-1", [USER_ID], "en", {
      teacherName: "T",
    });
    const whatsapp = payloads.find(p => p.channel === NotificationChannel.WHATSAPP);
    const template = whatsapp?.metadata?.whatsappTemplate;
    const purpose = template && typeof template === "object" ? Reflect.get(template, "purpose") : undefined;

    expect(purpose).toBe(WhatsappAccountPurpose.STUDENTS);
  });
});
