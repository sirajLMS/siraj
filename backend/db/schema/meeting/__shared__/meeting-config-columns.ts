import { boolean, jsonb, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { encryptedText } from "@/backend/db/schema/custom-types";
import { meetingProviders } from "@/backend/db/schema/meeting/meeting-providers";
import type { MeetingConfigDetails } from "@/backend/types/meeting/meeting-config.types";

/**
 * Shared column definitions common to both `class_meeting_configs` and
 * `user_meeting_configs` tables. Extracted to eliminate SonarQube duplication.
 */
export function meetingConfigSharedColumns() {
  return {
    providerId: uuid("provider_id")
      .notNull()
      .references(() => meetingProviders.id, { onDelete: "restrict" }),
    label: varchar("label", { length: 100 }),
    isDefault: boolean("is_default").notNull().default(false),
    details: jsonb("details").$type<MeetingConfigDetails>().notNull(),
    encryptedSecret: encryptedText("encrypted_secret"),
    providerMetadata: jsonb("provider_metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  };
}
