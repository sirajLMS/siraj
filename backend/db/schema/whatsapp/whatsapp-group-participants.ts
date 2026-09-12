import {
  createTable,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { whatsappGroups } from "@/backend/db/schema/whatsapp/whatsapp-groups";

/**
 * Participants of a WhatsApp group (Meta WhatsApp Cloud API Groups).
 *
 * `waId` is the participant's WhatsApp ID and is unique per group —
 * participant syncs and join/leave webhook events upsert on
 * (groupId, waId) instead of duplicating rows. `addedVia` records the
 * provenance of the membership: invite_link | business | participant.
 */
export const whatsappGroupParticipants = createTable(
  "whatsapp_group_participants",
  {
    id: uuidColumn("id"),
    groupId: uuidDefaultColumn("group_id")
      .notNull()
      .references(() => whatsappGroups.id, { onDelete: "cascade" }),
    waId: varcharColumn("wa_id", { length: 32 }).notNull(),
    joinedAt: timestampColumn("joined_at"),
    addedVia: varcharColumn("added_via", { length: 32 }),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
  },
  table => [uniqueIndex("whatsapp_group_participants_group_wa_id_unique").on(table.groupId, table.waId)]
);
