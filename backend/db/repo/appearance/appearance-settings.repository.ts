/**
 * Site Appearance Customization — Repository Layer
 *
 * Pure data-access functions for the single-row `appearance_settings` table.
 * No business logic, permission checks, or audit emission — those belong to
 * `AppearanceSettingsService` (Task 2.3).
 *
 * Conventions (per `backend/db/repo/AGENTS.md`):
 * - Bare reads use `queryDb(tx)` so stateless Neon HTTP mode is eligible when
 *   no `tx` is passed (AGENTS.md "Neon HTTP Client for Bare Reads").
 * - Write mutations accept `tx?: DBTransaction`; the service layer is
 *   responsible for wrapping writes in a transaction (implementation.md §24).
 * - `updatedByUserId` is always stamped from the session context (BOLA defense,
 *   decision #20) — never accepted from client input.
 *
 * Design: `.ai/plans/brand/implementation.md` §3.
 * Types:  `backend/types/appearance.types.ts` (Task 2.1).
 * Schema: `backend/db/schema/appearance/appearance-settings.schema.ts` (Task 2).
 */

import type { PaletteMode } from "@mui/material/styles";
import { eq } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { appearanceSettings } from "@/backend/db/schema";
import type { AppearanceFields, AppearanceSettingsRow, DBTransaction } from "@/backend/types";

/**
 * Column patch shared by {@link AppearanceSettingsRepository.upsert} (full-row
 * write) and {@link AppearanceSettingsRepository.publishDraft} (draft to
 * published copy). Centralising the column shape keeps the two write paths
 * from drifting.
 */
type AppearanceWritePatch = {
  primaryMain: string;
  secondaryMain: string;
  logoUrl: string | null;
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  defaultColorScheme: PaletteMode;
  draftFields: AppearanceFields;
  updatedByUserId: string;
  updatedAt: Date;
};

/**
 * Maps a raw Drizzle row (`Date` timestamps) into the canonical
 * {@link AppearanceSettingsRow} (ISO string timestamps).
 *
 * The `draftFields` jsonb and `defaultColorScheme` text column are already
 * typed at the schema level via `.$type<AppearanceFields>()` and
 * `.$type<PaletteMode>()` respectively (see
 * `backend/db/schema/appearance/appearance-settings.schema.ts`), so no `as`
 * casts are needed here — only the timestamp conversion (Date -> ISO string).
 *
 * This is the repo-boundary mapper anticipated by Task 2.1 carry-forward #1
 * and #2: `AppearanceSettingsRow` is an explicit object literal (NOT
 * `$inferSelect`) because the design calls for ISO string timestamps.
 */
function toAppearanceSettingsRow(row: typeof appearanceSettings.$inferSelect): AppearanceSettingsRow {
  return {
    id: row.id,
    primaryMain: row.primaryMain,
    secondaryMain: row.secondaryMain,
    logoUrl: row.logoUrl,
    siteName: row.siteName,
    siteTitle: row.siteTitle,
    siteDescription: row.siteDescription,
    defaultColorScheme: row.defaultColorScheme,
    draftFields: row.draftFields,
    updatedByUserId: row.updatedByUserId,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Insert-or-update the single global `appearance_settings` row with the given
 * column patch.
 *
 * On UPDATE, the existing row id is preserved. On INSERT, the database
 * generates `id` via `defaultRandom()`. The check-then-update-or-insert
 * pattern mirrors `SiteContentRepository.upsert` — the table has no natural
 * unique business key other than `id` (auto-generated), so
 * `onConflictDoUpdate` cannot target a stable column.
 *
 * The service layer should wrap writes in a transaction to avoid the (tiny)
 * race window between the SELECT and the INSERT.
 */
async function writeAppearanceRow(patch: AppearanceWritePatch, tx?: DBTransaction): Promise<AppearanceSettingsRow> {
  const q = queryDb(tx);
  const [existing] = await q.select().from(appearanceSettings).limit(1);
  if (existing) {
    const [updated] = await q
      .update(appearanceSettings)
      .set(patch)
      .where(eq(appearanceSettings.id, existing.id))
      .returning();
    return toAppearanceSettingsRow(updated);
  }
  const [inserted] = await q.insert(appearanceSettings).values(patch).returning();
  return toAppearanceSettingsRow(inserted);
}

export namespace AppearanceSettingsRepository {
  /**
   * Fetch the single global `appearance_settings` row, or `null` if the table
   * is empty (i.e. the row has not been seeded yet by
   * `AppearanceSettingsService.getFirstAppearancePublished`).
   *
   * Per `backend/db/repo/AGENTS.md` Neon-HTTP rule, this bare read uses
   * `queryDb(tx)` so stateless Neon HTTP mode is eligible when no `tx` is
   * passed.
   */
  export async function get(tx?: DBTransaction): Promise<AppearanceSettingsRow | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(appearanceSettings).limit(1);
    return row ? toAppearanceSettingsRow(row) : null;
  }

  /**
   * Insert-or-update the single global `appearance_settings` row.
   *
   * Writes BOTH the published columns and `draft_fields` from `input` (the
   * service layer is responsible for AC-8 compliance by passing the existing
   * published columns through unchanged when persisting a draft-only edit).
   * `updatedByUserId` is always stamped from the session context (BOLA defense,
   * decision #20) — the value on `input.updatedByUserId` is ignored.
   *
   * `input.id`, `input.updatedAt`, and `input.createdAt` are ignored — the
   * database manages these (`defaultRandom()` for id, `defaultNow()` for
   * timestamps). On the UPDATE path, the existing row id is preserved.
   */
  export async function upsert(
    input: AppearanceSettingsRow,
    updatedByUserId: string,
    tx?: DBTransaction
  ): Promise<AppearanceSettingsRow> {
    return writeAppearanceRow(
      {
        primaryMain: input.primaryMain,
        secondaryMain: input.secondaryMain,
        logoUrl: input.logoUrl,
        siteName: input.siteName,
        siteTitle: input.siteTitle,
        siteDescription: input.siteDescription,
        defaultColorScheme: input.defaultColorScheme,
        draftFields: input.draftFields,
        updatedByUserId,
        updatedAt: new Date(),
      },
      tx
    );
  }

  /**
   * Atomic "copy draft to published" operation (AC-9).
   *
   * Computes the published single-mode colors from
   * `draftFields.colors[draftFields.defaultColorScheme]` and writes BOTH the
   * `draft_fields` JSONB and the seven published columns in a single
   * `UPDATE` (or `INSERT` if no row exists yet). The remaining scalar fields
   * (`logoUrl`, `siteName`, `siteTitle`, `siteDescription`,
   * `defaultColorScheme`) are copied 1:1 from `draftFields`.
   *
   * `updatedByUserId` is stamped from the session context (BOLA defense,
   * decision #20).
   */
  export async function publishDraft(
    draftFields: AppearanceFields,
    updatedByUserId: string,
    tx?: DBTransaction
  ): Promise<AppearanceSettingsRow> {
    const activeColors = draftFields.colors[draftFields.defaultColorScheme];
    return writeAppearanceRow(
      {
        primaryMain: activeColors.primaryMain,
        secondaryMain: activeColors.secondaryMain,
        logoUrl: draftFields.logoUrl,
        siteName: draftFields.siteName,
        siteTitle: draftFields.siteTitle,
        siteDescription: draftFields.siteDescription,
        defaultColorScheme: draftFields.defaultColorScheme,
        draftFields,
        updatedByUserId,
        updatedAt: new Date(),
      },
      tx
    );
  }
}
