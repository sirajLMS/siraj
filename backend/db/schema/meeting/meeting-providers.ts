import {
  booleanColumn,
  createTable,
  index,
  jsonbColumn,
  textColumn,
  timestampColumn,
  uuidColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import type { MeetingProviderFieldSchema, MeetingProviderKind } from "@/backend/types";
import type { LocalizedString } from "@/shared/types";

export const meetingProviders = createTable(
  "meeting_providers",
  {
    id: uuidColumn("id"),
    slug: varcharColumn("slug", { length: 100 }).notNull().unique(),
    providerKind: varcharColumn("provider_kind", { length: 50 })
      .notNull()
      .default("manual")
      .$type<MeetingProviderKind>(),
    name: jsonbColumn<LocalizedString>("name").notNull(),
    description: jsonbColumn<LocalizedString>("description"),
    instructions: jsonbColumn<LocalizedString>("instructions"),
    urlAllowlist: jsonbColumn<readonly string[]>("url_allowlist").notNull(),
    urlExample: textColumn("url_example"),
    logoUrl: textColumn("logo_url"),
    fieldSchema: jsonbColumn<MeetingProviderFieldSchema>("field_schema").notNull(),
    isActive: booleanColumn("is_active").notNull().default(true),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("meeting_providers_is_active_idx").on(table.isActive),
    index("meeting_providers_provider_kind_idx").on(table.providerKind),
    index("meeting_providers_created_at_idx").on(table.createdAt),
    index("meeting_providers_updated_at_idx").on(table.updatedAt),
  ]
);
