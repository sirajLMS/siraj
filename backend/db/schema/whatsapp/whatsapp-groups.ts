import {
  booleanColumn,
  createTable,
  index,
  integerColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { whatsappGroupJoinApprovalModeEnum } from "@/backend/db/schema/enums";
import { whatsappAccounts } from "@/backend/db/schema/whatsapp/whatsapp-accounts";

/**
 * WhatsApp groups (Meta WhatsApp Cloud API Groups).
 *
 * `groupJid` is Meta's group identifier (e.g.
 * "Y2FwaV9ncm91cDoxNzA1NTU1MDEzOToxMjAzNjM0MDQ2OTQyMzM4MjAZD") stored verbatim
 * with a per-account unique constraint — group syncs and webhook upserts
 * reconcile on (accountId, groupJid) instead of duplicating rows.
 *
 * `totalParticipantCount`/`pendingJoinRequestCount` are denormalized Meta
 * rollups; `syncedAt` records the last successful Graph API sync and
 * `deletedAt` soft-deletes a group removed via the API or a webhook so
 * archived groups stay queryable.
 */
export const whatsappGroups = createTable(
  "whatsapp_groups",
  {
    id: uuidColumn("id"),
    accountId: uuidDefaultColumn("account_id")
      .notNull()
      .references(() => whatsappAccounts.id, { onDelete: "cascade" }),
    groupJid: varcharColumn("group_jid", { length: 256 }).notNull(),
    subject: varcharColumn("subject", { length: 128 }).notNull(),
    description: textColumn("description"),
    joinApprovalMode: whatsappGroupJoinApprovalModeEnum("join_approval_mode").notNull(),
    inviteLink: textColumn("invite_link"),
    suspended: booleanColumn("suspended").notNull().default(false),
    totalParticipantCount: integerColumn("total_participant_count").notNull().default(0),
    pendingJoinRequestCount: integerColumn("pending_join_request_count").notNull().default(0),
    creationTimestamp: timestampColumn("creation_timestamp"),
    syncedAt: timestampColumn("synced_at"),
    deletedAt: timestampColumn("deleted_at"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    uniqueIndex("whatsapp_groups_account_group_jid_unique").on(table.accountId, table.groupJid),
    index("whatsapp_groups_account_created_at_idx").on(table.accountId, table.deletedAt, table.createdAt),
  ]
);
