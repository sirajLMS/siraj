import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  WhatsappAccountPurpose,
  WhatsappOnboardingMode,
  WhatsappSyncStatus,
} from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { WhatsappGroupJoinApprovalMode } from "@/backend/enum/whatsapp/whatsapp-groups.enum";
import type { WhatsappAccountReturnType, WhatsappGroupReturnType } from "@/backend/types";

// ---------------------------------------------------------------------------
// Mocks — must register before SUT import
// ---------------------------------------------------------------------------

const findByPhoneNumberIdMock = mock(async (): Promise<WhatsappAccountReturnType | null> => null);

const groupFindByGroupJidMock = mock(async (): Promise<WhatsappGroupReturnType | null> => null);
const groupUpsertByGroupJidMock = mock(async (): Promise<unknown> => null);
const groupMarkActiveMock = mock(async (): Promise<boolean> => true);
const groupMarkDeletedMock = mock(async (): Promise<boolean> => true);
const groupUpdateSettingsMock = mock(async (): Promise<unknown> => null);
const groupAdjustPendingJoinRequestsMock = mock(async (): Promise<unknown> => null);
const participantUpsertByWaIdMock = mock(async (..._args: unknown[]): Promise<unknown> => null);
const participantRemoveByWaIdMock = mock(async (): Promise<boolean> => true);
const participantCountByGroupMock = mock(async (): Promise<number> => 0);

await mock.module("@/backend/db/repo/whatsapp", () => ({
  WhatsappAccountRepository: {},
  WhatsappWebhookEventRepository: {},
  WhatsappGroupMessageRepository: {},
  WhatsappGroupRepository: {
    findByGroupJid: groupFindByGroupJidMock,
    upsertByGroupJid: groupUpsertByGroupJidMock,
    markActive: groupMarkActiveMock,
    markDeleted: groupMarkDeletedMock,
    updateSettings: groupUpdateSettingsMock,
    adjustPendingJoinRequests: groupAdjustPendingJoinRequestsMock,
  },
  WhatsappGroupParticipantRepository: {
    upsertByWaId: participantUpsertByWaIdMock,
    removeByWaId: participantRemoveByWaIdMock,
    countByGroup: participantCountByGroupMock,
  },
}));

await mock.module("@/backend/services/whatsapp/whatsapp-account.service", () => ({
  WhatsappAccountService: { systemFindByPhoneNumberId: findByPhoneNumberIdMock },
}));

await mock.module("@/backend/lib/logger", () => ({
  logger: { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, logDomainError: () => {} },
}));

async function importHelpers() {
  return import("@/backend/services/whatsapp/whatsapp-webhook-groups.helpers");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function patchArg(callIndex: number): Record<string, unknown> {
  const calls: unknown = groupUpdateSettingsMock.mock.calls;
  const call = Array.isArray(calls) ? calls[callIndex] : undefined;
  const patch = Array.isArray(call) ? call[1] : undefined;
  return isRecord(patch) ? patch : {};
}

function upsertArg(callIndex: number): Record<string, unknown> {
  const calls: unknown = groupUpsertByGroupJidMock.mock.calls;
  const call = Array.isArray(calls) ? calls[callIndex] : undefined;
  const input = Array.isArray(call) ? call[0] : undefined;
  return isRecord(input) ? input : {};
}

function makeGroup(overrides: Partial<WhatsappGroupReturnType> = {}): WhatsappGroupReturnType {
  return {
    id: "grp-1",
    accountId: "acct-1",
    groupJid: "meta-group-id-1",
    subject: "Siraj Group",
    description: null,
    joinApprovalMode: WhatsappGroupJoinApprovalMode.ApprovalRequired,
    inviteLink: null,
    suspended: false,
    totalParticipantCount: 0,
    pendingJoinRequestCount: 0,
    creationTimestamp: null,
    syncedAt: null,
    deletedAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

function makeAccount(): WhatsappAccountReturnType {
  return {
    id: "acct-1",
    wabaId: "waba-123",
    phoneNumberId: "[PHONE_REDACTED]",
    displayName: null,
    displayPhoneNumber: "+[PHONE_REDACTED]",
    qualityRating: null,
    portfolioMessagingLimitTier: null,
    throughputLevel: null,
    maxPhoneNumbersPerBusiness: null,
    purpose: WhatsappAccountPurpose.GENERAL,
    onboardingMode: WhatsappOnboardingMode.CLOUD_API,
    syncStatus: WhatsappSyncStatus.NOT_STARTED,
    syncPhase: null,
    syncProgress: 0,
    syncDeadlineAt: null,
    syncFailureReason: null,
    offboardedAt: null,
    isActive: true,
    isTestNumber: false,
    metaStatus: null,
    lastWebhookAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };
}

function groupValue(events: unknown[]) {
  return { metadata: { phone_number_id: "[PHONE_REDACTED]" }, groups: events };
}

beforeEach(() => {
  findByPhoneNumberIdMock.mockReset();
  findByPhoneNumberIdMock.mockResolvedValue(makeAccount());
  groupFindByGroupJidMock.mockReset();
  groupFindByGroupJidMock.mockResolvedValue(makeGroup());
  groupUpsertByGroupJidMock.mockReset();
  groupUpsertByGroupJidMock.mockResolvedValue(makeGroup());
  groupMarkActiveMock.mockReset();
  groupMarkActiveMock.mockResolvedValue(true);
  groupMarkDeletedMock.mockReset();
  groupMarkDeletedMock.mockResolvedValue(true);
  groupUpdateSettingsMock.mockReset();
  groupAdjustPendingJoinRequestsMock.mockReset();
  participantUpsertByWaIdMock.mockReset();
  participantRemoveByWaIdMock.mockReset();
  participantRemoveByWaIdMock.mockResolvedValue(true);
  participantCountByGroupMock.mockReset();
  participantCountByGroupMock.mockResolvedValue(1);
});

describe("handleGroupLifecycleField — group_create upsert", () => {
  test("group_create upserts the group row with the Meta wire fields", async () => {
    const { handleGroupLifecycleField } = await importHelpers();

    await handleGroupLifecycleField(
      groupValue([
        {
          type: "group_create",
          group_id: "meta-group-id-1",
          subject: "Renamed Group",
          join_approval_mode: "auto_approve",
          invite_link: "https://chat.whatsapp.com/abc",
          timestamp: 1705555013,
        },
      ]),
      "waba-123"
    );

    expect(groupFindByGroupJidMock).toHaveBeenCalledWith("acct-1", "meta-group-id-1");
    const input = upsertArg(0);
    expect(input.accountId).toBe("acct-1");
    expect(input.groupJid).toBe("meta-group-id-1");
    expect(input.subject).toBe("Renamed Group");
    expect(input.joinApprovalMode).toBe(WhatsappGroupJoinApprovalMode.AutoApprove);
    expect(input.inviteLink).toBe("https://chat.whatsapp.com/abc");
    const created = input.creationTimestamp;
    if (!(created instanceof Date)) {
      throw new Error("expected creationTimestamp to be a Date");
    }
    expect(created.getTime()).toBe(1705555013 * 1000);
  });

  test("group_create re-activates a soft-deleted row before the upsert", async () => {
    const { handleGroupLifecycleField } = await importHelpers();
    groupFindByGroupJidMock.mockResolvedValueOnce(makeGroup({ deletedAt: new Date() }));

    await handleGroupLifecycleField(
      groupValue([{ type: "group_create", group_id: "meta-group-id-1", subject: "Back Again" }]),
      "waba-123"
    );

    expect(groupMarkActiveMock).toHaveBeenCalledWith("grp-1");
    expect(groupUpsertByGroupJidMock).toHaveBeenCalled();
  });

  test("group_delete soft-deletes the local row; an unknown group is skipped", async () => {
    const { handleGroupLifecycleField } = await importHelpers();

    await handleGroupLifecycleField(groupValue([{ type: "group_delete", group_id: "meta-group-id-1" }]), "waba-123");

    expect(groupMarkDeletedMock).toHaveBeenCalledWith("grp-1");

    groupMarkDeletedMock.mockReset();
    groupFindByGroupJidMock.mockResolvedValueOnce(null);
    await handleGroupLifecycleField(
      groupValue([{ type: "group_delete", group_id: "meta-group-id-unknown" }]),
      "waba-123"
    );
    expect(groupMarkDeletedMock).not.toHaveBeenCalled();
  });
});

describe("handleGroupParticipantsField — membership adds/removes and join-request deltas", () => {
  test("group_participants_add upserts memberships and syncs the totalParticipantCount rollup", async () => {
    const { handleGroupParticipantsField } = await importHelpers();

    await handleGroupParticipantsField(
      groupValue([
        {
          type: "group_participants_add",
          group_id: "meta-group-id-1",
          added_participants: ["966555000111"],
          reason: "invite_link",
          timestamp: 1705555013,
        },
      ]),
      "waba-123"
    );

    expect(participantUpsertByWaIdMock).toHaveBeenCalledTimes(1);
    const rawInput = participantUpsertByWaIdMock.mock.calls[0]?.[0];
    const input = isRecord(rawInput) ? rawInput : {};
    expect(input.groupId).toBe("grp-1");
    expect(input.waId).toBe("966555000111");
    expect(input.addedVia).toBe("invite_link");
    expect(participantCountByGroupMock).toHaveBeenCalledWith("grp-1");
    expect(groupUpdateSettingsMock).toHaveBeenCalledWith("grp-1", { totalParticipantCount: 1 });
  });

  test("group_participants_remove with initiated_by participant deletes memberships and syncs the rollup", async () => {
    const { handleGroupParticipantsField } = await importHelpers();

    await handleGroupParticipantsField(
      groupValue([
        {
          type: "group_participants_remove",
          group_id: "meta-group-id-1",
          removed_participants: ["966555000111"],
          initiated_by: "participant",
        },
      ]),
      "waba-123"
    );

    expect(participantRemoveByWaIdMock).toHaveBeenCalledWith("grp-1", "966555000111");
    expect(groupUpdateSettingsMock).toHaveBeenCalledWith("grp-1", { totalParticipantCount: 1 });
  });

  test("group_join_request_created / revoked adjust the pending counter by the count delta", async () => {
    const { handleGroupParticipantsField } = await importHelpers();

    await handleGroupParticipantsField(
      groupValue([
        { type: "group_join_request_created", group_id: "meta-group-id-1" },
        { type: "group_join_request_revoked", group_id: "meta-group-id-1" },
      ]),
      "waba-123"
    );

    expect(groupAdjustPendingJoinRequestsMock).toHaveBeenCalledTimes(2);
    expect(groupAdjustPendingJoinRequestsMock).toHaveBeenNthCalledWith(1, "grp-1", 1);
    expect(groupAdjustPendingJoinRequestsMock).toHaveBeenNthCalledWith(2, "grp-1", -1);
  });
});

describe("handleGroupSettingsField — partial update_successful patches", () => {
  test("subject + description updates fold into one settings patch", async () => {
    const { handleGroupSettingsField } = await importHelpers();

    await handleGroupSettingsField(
      groupValue([
        {
          group_id: "meta-group-id-1",
          group_subject: { text: "New Subject", update_successful: true },
          group_description: { text: "New Description", update_successful: true },
        },
      ]),
      "waba-123"
    );

    expect(groupUpdateSettingsMock).toHaveBeenCalledTimes(1);
    expect(patchArg(0)).toEqual({ subject: "New Subject", description: "New Description" });
  });

  test("a failed update_successful folds nothing — no write when the patch is empty", async () => {
    const { handleGroupSettingsField } = await importHelpers();

    await handleGroupSettingsField(
      groupValue([
        {
          group_id: "meta-group-id-1",
          group_subject: { text: "Rejected Subject", update_successful: false },
          profile_picture: { update_successful: true },
        },
      ]),
      "waba-123"
    );

    expect(groupUpdateSettingsMock).not.toHaveBeenCalled();
  });
});

describe("handleGroupStatusField — suspend / suspend-cleared", () => {
  test("group_suspend flips suspended true; group_suspend_cleared flips it back", async () => {
    const { handleGroupStatusField } = await importHelpers();

    await handleGroupStatusField(groupValue([{ type: "group_suspend", group_id: "meta-group-id-1" }]), "waba-123");
    expect(groupUpdateSettingsMock).toHaveBeenCalledWith("grp-1", { suspended: true });

    await handleGroupStatusField(
      groupValue([{ type: "group_suspend_cleared", group_id: "meta-group-id-1" }]),
      "waba-123"
    );
    expect(groupUpdateSettingsMock).toHaveBeenLastCalledWith("grp-1", { suspended: false });
  });

  test("an unknown status event type writes nothing", async () => {
    const { handleGroupStatusField } = await importHelpers();

    await handleGroupStatusField(groupValue([{ type: "group_banned", group_id: "meta-group-id-1" }]), "waba-123");

    expect(groupUpdateSettingsMock).not.toHaveBeenCalled();
  });
});
