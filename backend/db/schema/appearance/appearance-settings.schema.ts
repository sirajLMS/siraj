import type { PaletteMode } from "@mui/material/styles";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
export const appearanceSettings = pgTable(
  "appearance_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    primaryMain: text("primary_main").notNull(),
    secondaryMain: text("secondary_main").notNull(),
    logoUrl: text("logo_url"),
    siteName: text("site_name").notNull(),
    siteTitle: text("site_title").notNull(),
    siteDescription: text("site_description").notNull(),
    defaultColorScheme: text("default_color_scheme").$type<PaletteMode>().notNull(),
    draftFields: jsonb("draft_fields").$type<AppearanceFields>().notNull(),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).defaultNow().notNull(),
  },
  table => [
    index("appearance_settings_updated_by_user_id_idx").on(table.updatedByUserId),
    index("appearance_settings_updated_at_idx").on(table.updatedAt),
  ]
);
