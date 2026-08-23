import {
  booleanColumn,
  encryptedText,
  jsonbColumn,
  timestampColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { meetingProviders } from "@/backend/db/schema/meeting/meeting-providers";
import type { MeetingConfigDetails } from "@/backend/types";

/**
 * Shared column definitions common to both `class_meeting_configs` and
 * `user_meeting_configs` tables. Extracted to eliminate SonarQube duplication.
 */
export function meetingConfigSharedColumns() {
  return {
    providerId: uuidDefaultColumn("provider_id")
      .notNull()
      .references(() => meetingProviders.id as never, { onDelete: "restrict" }),
    label: varcharColumn("label", { length: 100 }),
    isDefault: booleanColumn("is_default").notNull().default(false),
    details: jsonbColumn<MeetingConfigDetails>("details").notNull(),
    encryptedSecret: encryptedText("encrypted_secret"),
    providerMetadata: jsonbColumn<Record<string, unknown>>("provider_metadata"),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  };
}
