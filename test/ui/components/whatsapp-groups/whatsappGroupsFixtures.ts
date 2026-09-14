import { WhatsappGroupJoinApprovalMode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappGroupRow } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

export const GROUP_ID = "group-1";

export function makeGroupRow(id: string, overrides: Partial<WhatsappGroupRow> = {}): WhatsappGroupRow {
  return {
    id,
    accountId: "acc-1",
    groupJid: `${id}@g.us`,
    subject: `Group ${id}`,
    description: null,
    joinApprovalMode: WhatsappGroupJoinApprovalMode.AutoApprove,
    inviteLink: null,
    suspended: false,
    totalParticipantCount: 12,
    pendingJoinRequestCount: 0,
    creationTimestamp: "2026-08-01T00:00:00.000Z",
    syncedAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}
