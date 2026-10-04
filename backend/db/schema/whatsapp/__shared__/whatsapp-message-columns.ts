import { jsonbColumn, uuidDefaultColumn, varcharColumn } from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { whatsappMessageDirectionEnum } from "@/backend/db/schema/enums";
import { whatsappAccounts } from "@/backend/db/schema/whatsapp/whatsapp-accounts";

/**
 * Shared column set for the WhatsApp message tables (`whatsapp_messages`,
 * `whatsapp_group_messages`): the columns both tables define identically —
 * `accountId` (self-referencing `whatsapp_accounts`), `wamid`, `direction`,
 * `type`, `content`, and `status`.
 *
 * Spread the returned object into a `createTable` column config. Spread
 * matches direct column definitions exactly — Drizzle infers the same
 * `$inferSelect` / `$inferInsert` types — so the generated migration is
 * unchanged.
 */
export function whatsappMessageColumns() {
  return {
    accountId: uuidDefaultColumn("account_id")
      .notNull()
      .references(() => whatsappAccounts.id, { onDelete: "cascade" }),
    wamid: varcharColumn("wamid", { length: 128 }).notNull(),
    direction: whatsappMessageDirectionEnum("direction").notNull(),
    type: varcharColumn("type", { length: 32 }).notNull(),
    content: jsonbColumn("content").notNull(),
    status: varcharColumn("status", { length: 20 }),
  };
}
