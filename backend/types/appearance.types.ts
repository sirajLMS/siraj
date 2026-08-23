/**
 * Site Appearance Customization — Type Definitions
 *
 * Canonical type source for the `appearance_settings` entity. All GraphQL
 * Pothos objects, repository functions, and service methods import from here.
 *
 * Design rationale (see `.ai/plans/brand/outcome/decisions.md`):
 * - **Decision #2** — Brand primitives only (7 atomic inputs). MUI `nativeColor`
 *   derives light/dark/contrastText from the single `main` value via CSS
 *   `color-mix()` + relative-color functions.
 * - **Decision #7** — Draft + Publish model. Published columns are single-mode
 *   (`primary_main`, `secondary_main`); `draft_fields` JSONB mirrors all
 *   published columns for staging edits.
 * - **Decision #12** — Per-mode color editing. The draft stores colors per mode
 *   (`{ light: {...}, dark: {...} }`) so the admin can edit each mode in the
 *   `?customize=1` overlay. On publish, the draft's active-mode colors (per
 *   `defaultColorScheme`) are copied into the single published columns.
 *
 * File location: `backend/types/appearance.types.ts` per
 * `.ai/plans/brand/implementation.md` §2. Barrel re-export is added to
 * `backend/types/index.ts` (single root-level file mirroring the design).
 */

import type { PaletteMode } from "@mui/material/styles";

/**
 * Per-mode brand colors for the appearance draft.
 *
 * Each mode stores the two atomic brand primitives (`primaryMain`,
 * `secondaryMain`). MUI derives the full palette (light/dark/contrastText)
 * in-browser via `nativeColor: true` + CSS `color-mix()` (decision #3).
 */
export interface PerModeColors {
  /** Light-mode brand colors. */
  light: { primaryMain: string; secondaryMain: string };
  /** Dark-mode brand colors. */
  dark: { primaryMain: string; secondaryMain: string };
}

/**
 * Canonical appearance field bundle (the 7 atomic inputs from decision #2,
 * with colors split per-mode per decision #12).
 *
 * Used as:
 * - The shape of `draft_fields` JSONB on `AppearanceSettingsRow`.
 * - The submit input for `saveAppearanceDraft` / `resetAppearanceDraft`.
 * - The published projection returned by `getFirstAppearancePublished()`.
 */
export interface AppearanceFields {
  /** Per-mode brand colors (edited independently in the customizer). */
  colors: PerModeColors;
  /** URL of the uploaded logo (nullable; resolved via the storage pipeline). */
  logoUrl: string | null;
  /** Short brand name, e.g. "Siraj". Used in navbar brand + `<title>` template. */
  siteName: string;
  /** Full title for `<title>` template + app header. */
  siteTitle: string;
  /** Meta description / OG description. */
  siteDescription: string;
  /** Default mode for new visitors (decision #2). Drives which mode's colors
   *  are copied into the published columns on `publish`. */
  defaultColorScheme: PaletteMode;
}

/**
 * Database row for `appearance_settings` (single global row, no `tenant_id`).
 *
 * The published columns (`primaryMain`, `secondaryMain`, etc.) hold the
 * currently-live single-mode values. On `publish`, the draft's active-mode
 * colors (`draftFields.colors[draftFields.defaultColorScheme]`) are copied
 * into `primaryMain`/`secondaryMain`, and the other scalar fields are copied
 * 1:1 from `draftFields`.
 *
 * `draftFields` is the typed JSONB blob (per-mode colors + scalar staging).
 *
 * Timestamps are ISO strings (serialized by the repository before returning).
 */
export type AppearanceSettingsRow = {
  id: string;
  /** Published (active-mode) primary color, e.g. `#2DD4BF`. */
  primaryMain: string;
  /** Published (active-mode) secondary color. */
  secondaryMain: string;
  /** Published logo URL. */
  logoUrl: string | null;
  /** Published site name. */
  siteName: string;
  /** Published site title. */
  siteTitle: string;
  /** Published site description. */
  siteDescription: string;
  /** Published default color scheme (light/dark). */
  defaultColorScheme: PaletteMode;
  /** Typed JSONB draft (per-mode colors + staging scalars). */
  draftFields: AppearanceFields;
  /** User who last wrote the row (resolved from `ctx.userId`, never client input). */
  updatedByUserId: string | null;
  /** Last write timestamp (ISO string). */
  updatedAt: string;
  /** Row creation timestamp (ISO string). */
  createdAt: string;
};

/**
 * Service / GraphQL return shape.
 *
 * Semantically a 1:1 projection of {@link AppearanceSettingsRow} — no fields
 * are omitted because there are no forbidden/internal fields on this entity
 * (audit fields `updatedByUserId` / `updatedAt` are exposed to admins with
 * `SETTINGS_VIEW` or `SETTINGS_APPEARANCE_MANAGE`).
 *
 * Declared as `Omit<…, never>` (rather than `typeof appearanceSettings.$inferSelect`
 * or a bare `= AppearanceSettingsRow` alias) for two reasons:
 * 1. It structurally enforces the typed `draftFields: AppearanceFields` JSONB
 *    at the type boundary (Drizzle's `$inferSelect` would type `draftFields`
 *    as `unknown`).
 * 2. It satisfies `sonarjs/redundant-type-aliases` (which flags bare
 *    `Type = OtherAlias` declarations) while remaining structurally
 *    identical to `AppearanceSettingsRow`. The same `Omit<X, never>` pattern
 *    is used by `ImpersonationSessionReturnType` in `backend/types/auth/`.
 */
export type AppearanceSettingsReturnType = Omit<AppearanceSettingsRow, never>;

/**
 * Submit input for `saveAppearanceDraft` / `resetAppearanceDraft` mutations.
 *
 * Equal to {@link AppearanceFields} — the admin submits the full draft
 * (colors per mode + scalar fields). `updatedByUserId` is resolved from the
 * session context, never accepted from client input (decision #20 — BOPLA).
 */
export type AppearanceSettingsSubmitInput = AppearanceFields;

/**
 * Draft input alias — semantically distinct from `SubmitInput` for
 * readability at call sites where the draft is being seeded from defaults
 * (e.g. `resetDraft` -> `DEFAULT_APPEARANCE_FIELDS`) rather than submitted
 * by a client. Structurally identical to {@link AppearanceFields}.
 */
export type AppearanceDraftInput = AppearanceFields;
