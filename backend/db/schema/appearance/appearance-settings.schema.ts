import type { PaletteMode } from "@mui/material/styles";
import {
  createTable,
  index,
  jsonbColumn,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { users } from "@/backend/db/schema/users/users";
import type { AppearanceFields } from "@/backend/types";

/**
 * Site appearance / branding settings.
 *
 * Single global row (no `tenant_id`); seeded via upsert on first read by
 * `AppearanceSettingsService.getFirstAppearancePublished`. The published
 * columns (`primary_main`, `secondary_main`, `logo_url`, `site_name`,
 * `site_title`, `site_description`, `default_color_scheme`) hold the
 * currently-live branding. The `draft_fields` jsonb holds an in-progress
 * `AppearanceFields` payload (per-mode colors etc.) that is copied into the
 * published columns on `publish`.
 *
 * See `.ai/plans/brand/implementation.md` §1 and `outcome/decisions.md` for
 * the locked decisions (#2, #7, #12).
 */
export const appearanceSettings = createTable(
  "appearance_settings",
  {
    id: uuidColumn("id"),
    primaryMain: textColumn("primary_main").notNull(),
    secondaryMain: textColumn("secondary_main").notNull(),
    logoUrl: textColumn("logo_url"),
    siteName: textColumn("site_name").notNull(),
    siteTitle: textColumn("site_title").notNull(),
    siteDescription: textColumn("site_description").notNull(),
    defaultColorScheme: textColumn("default_color_scheme").$type<PaletteMode>().notNull(),
    draftFields: jsonbColumn<AppearanceFields>("draft_fields").notNull(),
    updatedByUserId: uuidDefaultColumn("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestampColumn("updated_at").defaultNow().notNull(),
    createdAt: timestampColumn("created_at").defaultNow().notNull(),
  },
  table => [
    index("appearance_settings_updated_by_user_id_idx").on(table.updatedByUserId),
    index("appearance_settings_updated_at_idx").on(table.updatedAt),
  ]
);
