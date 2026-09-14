/**
 * Site Appearance Customization — Type Definitions
 *
 * Canonical type source for the `appearance_settings` entity. All GraphQL
 * Pothos objects, repository functions, and service methods import from here.
 *
 * Design rationale:
 * - **Brand primitives only** — 7 atomic inputs. MUI derives light/dark/
 *   contrastText from each `main` value via CSS `color-mix()` + relative-color
 *   functions.
 * - **Draft + Publish model** — published columns are single-mode
 *   (`primary_main`, `secondary_main`); the `draft_fields` JSONB mirrors all
 *   published columns for staging edits.
 * - **Per-mode color editing** — the draft stores colors per mode
 *   (`{ light: {...}, dark: {...} }`) so the admin can edit each mode in the
 *   customizer overlay. On publish, the draft's active-mode colors (per
 *   `defaultColorScheme`) are copied into the single published columns.
 */

import type { PaletteMode } from "@mui/material/styles";

/**
 * Brand color pair for a single mode (primary + secondary main colors).
 *
 * Backs the `AppearanceColorPair` / `AppearanceColorPairInput` GraphQL types
 * and the per-mode fields of {@link PerModeColors}.
 */
export interface AppearanceColorPair {
  /** Main brand color for the mode. */
  primaryMain: string;
  /** Secondary brand color for the mode. */
  secondaryMain: string;
}

/**
 * Per-mode brand colors for the appearance draft.
 *
 * Each mode stores the two atomic brand primitives (`primaryMain`,
 * `secondaryMain`). MUI derives the full palette (light/dark/contrastText)
 * in-browser via `nativeColor: true` + CSS `color-mix()`.
 */
export interface PerModeColors {
  /** Light-mode brand colors. */
  light: AppearanceColorPair;
  /** Dark-mode brand colors. */
  dark: AppearanceColorPair;
}

/**
 * Canonical appearance field bundle (the 7 atomic brand inputs, with colors
 * split per-mode).
 *
 * Used as:
 * - The shape of `draft_fields` JSONB on {@link AppearanceSettingsSelectType}.
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
  /** Default mode for new visitors. Drives which mode's colors are copied
   *  into the published columns on `publish`. */
  defaultColorScheme: PaletteMode;
}

/**
 * Database row for `appearance_settings` (single global row, no tenant
 * scoping).
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
export type AppearanceSettingsSelectType = {
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
 * Compatibility alias for the pre-rename name of
 * {@link AppearanceSettingsSelectType}. Structured as `Omit<…, never>` rather
 * than a bare alias so it stays structurally identical while satisfying
 * `sonarjs/redundant-type-aliases` (same pattern as
 * {@link AppearanceSettingsReturnType}).
 */
export type AppearanceSettingsRow = Omit<AppearanceSettingsSelectType, never>;

/**
 * Service / GraphQL return shape.
 *
 * Semantically a 1:1 projection of {@link AppearanceSettingsSelectType} — no
 * fields are omitted because there are no forbidden/internal fields on this
 * entity (audit fields `updatedByUserId` / `updatedAt` are exposed to admins
 * with `SETTINGS_VIEW` or `SETTINGS_APPEARANCE_MANAGE`).
 *
 * Declared as `Omit<…, never>` (rather than `typeof appearanceSettings.$inferSelect`
 * or a bare `= AppearanceSettingsSelectType` alias) for two reasons:
 * 1. It structurally enforces the typed `draftFields: AppearanceFields` JSONB
 *    at the type boundary (Drizzle's `$inferSelect` would type `draftFields`
 *    as `unknown`).
 * 2. It satisfies `sonarjs/redundant-type-aliases` (which flags bare
 *    `Type = OtherAlias` declarations) while remaining structurally
 *    identical to `AppearanceSettingsSelectType`. The same `Omit<X, never>`
 *    pattern is used by `ImpersonationSessionReturnType` in
 *    `backend/types/auth/`.
 */
export type AppearanceSettingsReturnType = Omit<AppearanceSettingsSelectType, never>;

/**
 * Submit input for `saveAppearanceDraft` / `resetAppearanceDraft` mutations.
 *
 * Equal to {@link AppearanceFields} — the admin submits the full draft
 * (colors per mode + scalar fields). `updatedByUserId` is resolved from the
 * session context, never accepted from client input (BOPLA).
 */
export type AppearanceSettingsSubmitInput = AppearanceFields;

/**
 * GraphQL input shape for the `saveAppearanceDraft` mutation. Mirrors
 * {@link AppearanceSettingsSubmitInput} (= {@link AppearanceFields}) with two
 * field-type adjustments required by Pothos input semantics:
 *   - `defaultColorScheme` is `string` (not `PaletteMode`) because there is
 *     no canonical `PaletteMode` enum registered in `backend/enum/`. The
 *     resolver coerces it to `PaletteMode`.
 *   - `logoUrl` is `string | null | undefined` (omittable + nullable). The
 *     resolver normalizes `undefined` to `null` to match the service shape.
 */
export type AppearanceDraftInput = Omit<AppearanceSettingsSubmitInput, "defaultColorScheme" | "logoUrl"> & {
  defaultColorScheme: string;
  logoUrl?: string | null;
};
