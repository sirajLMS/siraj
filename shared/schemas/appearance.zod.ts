/**
 * Site Appearance Customization — Zod Validation Schema (AC-38, decision §22).
 *
 * Single-source Zod schema for `AppearanceFields` runtime validation:
 *  - Validates `NEXT_PUBLIC_APP_BRANDING` env strings and mutation inputs
 *    synchronously (decision §22 — "Single-Source Zod Validation & Schema
 *    Type Inference").
 *  - Strict 6-digit hex color regex (matches the JSON Schema in
 *    `appearance.schema.json` and `HEX_PATTERN` in
 *    `shared/lib/color-contrast.utils.ts`).
 *  - String length limits matching the JSON Schema (Task 9.1).
 *  - Nullable, valid-URL `logoUrl` refinement.
 *
 * Relationship to `shared/schemas/appearance.schema.json` (Task 9.1):
 *  - JSON Schema: IDE/file validation (VS Code JSON language server).
 *  - Zod schema (this file): TypeScript-native runtime transforms + inference.
 *  - The two MUST be kept in sync (decision §22, Task 9.1 carry-forward).
 *
 * Layer note: lives in `shared/schemas/` so both `backend/` (service-layer
 * defense-in-depth on the JSONB boundary) and `frontend/` (future "Import
 * JSON" customizer flow) can import it without crossing layer boundaries.
 * Accepts `unknown` and infers its type from itself (no import of
 * `AppearanceFields` from `@/backend/types` — that would violate the
 * `shared/` layer isolation rule in `shared/AGENTS.md`). The inferred type
 * is structurally identical to `AppearanceFields`.
 *
 * Used by:
 *  - `AppearanceSettingsService.saveDraft` (defensive re-validation of the
 *    `draft_fields` JSONB boundary before write — AC-9, AC-10, AC-38).
 *  - Task 9.2 ENV hydration parser (validates `NEXT_PUBLIC_APP_BRANDING`
 *    payload before falling back to `DEFAULT_APPEARANCE_FIELDS` — AC-27).
 *  - Task 9.3 "Export JSON" / future "Import JSON" customizer flow (AC-28).
 */

import { z } from "zod";

/**
 * Strict 6-digit hex color pattern (`#RRGGBB`).
 *
 * Matches:
 *  - `appearance.schema.json` `pattern: "^#[0-9a-fA-F]{6}$"` (Task 9.1).
 *  - `HEX_PATTERN` in `shared/lib/color-contrast.utils.ts` (Task 9.6).
 *
 * Decision §22 mentions a more permissive `^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$`
 * (3-or-6-digit), but the locked JSON Schema (Task 9.1) and the contrast
 * utils both use the strict 6-digit form — `primaryMain`/`secondaryMain` are
 * persisted as `#RRGGBB` and the MUI `nativeColor` input always emits 6-digit
 * hex. The strict form keeps validation, persistence, and contrast math
 * aligned on a single input shape.
 */
export const APPEARANCE_HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Zod schema for per-mode brand colors (`{ primaryMain, secondaryMain }`).
 *
 * Both fields are 6-digit hex strings. Reused for `colors.light` and
 * `colors.dark` (mirrors the `$defs.perModeColors` reuse in the JSON Schema).
 */
export const zPerModeColors = z.object({
  primaryMain: z.string().regex(APPEARANCE_HEX_PATTERN, "must be a 6-digit hex color (e.g. #2DD4BF)"),
  secondaryMain: z.string().regex(APPEARANCE_HEX_PATTERN, "must be a 6-digit hex color (e.g. #9333EA)"),
});

/**
 * Zod schema for the canonical `AppearanceFields` shape (decision #2 + #12).
 *
 * Structural mirror of `AppearanceFields` in `backend/types/appearance.types.ts`:
 *  - `colors.{light,dark}.{primaryMain,secondaryMain}` — strict 6-digit hex.
 *  - `logoUrl` — nullable, valid URL (empty string tolerated as "unset").
 *  - `siteName` — 1-80 chars (short brand).
 *  - `siteTitle` — 1-120 chars (full title).
 *  - `siteDescription` — 0-300 chars (meta description; empty allowed).
 *  - `defaultColorScheme` — enum `["light", "dark"]`.
 *
 * `.strict()` enforces `additionalProperties: false` (rejects typo'd keys
 * like `primaryColor` instead of `primaryMain`) — matches the JSON Schema.
 *
 * The inferred TS type ({@link AppearanceFieldsZod}) is structurally
 * identical to `AppearanceFields` (the canonical type lives in
 * `backend/types/`). A future refactor could move the canonical type into
 * `shared/types/` and have `backend/types/` re-export
 * `z.infer<typeof zAppearanceFields>` — deferred to avoid cross-scope edits
 * in this task.
 */
export const zAppearanceFields = z
  .object({
    colors: z.object({
      light: zPerModeColors,
      dark: zPerModeColors,
    }),
    logoUrl: z
      .string()
      .nullable()
      .refine(value => value === null || value === "" || URL.canParse(value), "must be a valid URL or null"),
    siteName: z.string().min(1).max(80),
    siteTitle: z.string().min(1).max(120),
    siteDescription: z.string().min(0).max(300),
    defaultColorScheme: z.enum(["light", "dark"]),
  })
  .strict();

/**
 * Inferred TS type from {@link zAppearanceFields}.
 *
 * Structurally identical to `AppearanceFields` in `backend/types/`. Code in
 * `backend/` can pass `AppearanceFields`-typed values where
 * `AppearanceFieldsZod` is expected (and vice-versa) without casts.
 */
export type AppearanceFieldsZod = z.infer<typeof zAppearanceFields>;

/**
 * Safe parser — never throws.
 *
 * Wraps `zAppearanceFields.safeParse(data)` and returns the parsed value on
 * success, or `fallback` on failure. Use this on the JSONB boundary
 * (`saveDraft` / `publish` / `resetDraft` in `AppearanceSettingsService`)
 * and on the ENV-var boundary (`NEXT_PUBLIC_APP_BRANDING` parser in Task 9.2)
 * so corrupt input never crashes the server boot or the mutation path
 * (AC-27, AC-38).
 *
 * @param data     Unknown payload to validate (e.g. `JSON.parse(envString)`
 *                 or a GraphQL mutation input).
 * @param fallback Returned when validation fails (typically
 *                 `DEFAULT_APPEARANCE_FIELDS`).
 * @returns        The parsed {@link AppearanceFieldsZod} on success, or
 *                 `fallback` on failure.
 *
 * @example
 *   const safeInput = zAppearanceFieldsSafe(input, DEFAULT_APPEARANCE_FIELDS);
 */
export function zAppearanceFieldsSafe(data: unknown, fallback: AppearanceFieldsZod): AppearanceFieldsZod {
  const result = zAppearanceFields.safeParse(data);
  return result.success ? result.data : fallback;
}

/**
 * Parse a `NEXT_PUBLIC_APP_BRANDING` env value into a validated
 * {@link AppearanceFieldsZod}, with a fail-safe fallback (AC-27, AC-38).
 *
 * Accepts the raw env string (JSON), `undefined`/`null`/empty (returns
 * fallback), or an already-parsed object (re-validates). On any parse or
 * validation failure, returns `fallback` — never throws (decision §22:
 * "Invalid JSON in `NEXT_PUBLIC_APP_BRANDING` logs a domain error and
 * gracefully falls back to `DEFAULT_APPEARANCE_FIELDS` without throwing or
 * stalling server boot").
 *
 * The caller is responsible for logging the domain error if needed (kept
 * out of this `shared/` helper to avoid coupling to a specific logger).
 *
 * @param envValue  Raw env string (`process.env.NEXT_PUBLIC_APP_BRANDING`)
 *                  or `undefined`/`null`/empty when unset.
 * @param fallback  Returned when env is unset, empty, malformed JSON, or
 *                  fails schema validation (typically
 *                  `DEFAULT_APPEARANCE_FIELDS`).
 * @returns         Validated {@link AppearanceFieldsZod}, or `fallback`.
 *
 * @example
 *   const branding = parseAppearanceEnvBranding(
 *     process.env.NEXT_PUBLIC_APP_BRANDING,
 *     DEFAULT_APPEARANCE_FIELDS
 *   );
 */
export function parseAppearanceEnvBranding(
  envValue: string | undefined | null,
  fallback: AppearanceFieldsZod
): AppearanceFieldsZod {
  if (envValue === undefined || envValue === null || envValue === "") {
    return fallback;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(envValue);
  } catch {
    return fallback;
  }
  return zAppearanceFieldsSafe(parsed, fallback);
}
