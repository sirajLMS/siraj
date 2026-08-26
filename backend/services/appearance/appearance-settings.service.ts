/**
 * Site Appearance Customization — Service Layer
 *
 * Business logic for the single-row `appearance_settings` table. Bridges the
 * read path (SSR metadata, GraphQL resolver) with the write path (repo).
 *
 * Read path:
 *   - `getAppearance({ actorUserId, tx })` — returns the full row; upsert-seeds
 *     on first access IF `actorUserId` is provided (admin read). Public reads
 *     (no `actorUserId`) return `null` if no row exists; the caller falls back
 *     to {@link DEFAULT_APPEARANCE_FIELDS}.
 *   - `getFirstAppearancePublished()` — cached via `unstable_cache` with tag
 *     `"appearance"`. Returns the published {@link AppearanceFields}
 *     (reconstructed from published columns) or `null`. Does NOT seed (no
 *     user context on SSR; seeding happens on the first admin read).
 *
 * Write path — `saveDraft` / `publish` / `resetDraft`:
 *   All enforce `SETTINGS_APPEARANCE_MANAGE` (decision #5) and stamp
 *   `actorUserId` on `updatedByUserId` (BOLA defense — decision #20).
 *
 *   - `saveDraft(input, actorUserId, tErrors, tx?, expectedUpdatedAt?)` —
 *     replaces `draftFields` with `input`; published columns are preserved
 *     unchanged (AC-8). Seeds on first access with defaults for published
 *     + `input` for draft. When `expectedUpdatedAt` is provided and does
 *     not match the current row `updatedAt`, throws
 *     {@link AppearanceConflictError} (AC-33 — optimistic concurrency).
 *   - `publish(actorUserId, tErrors, tx?, expectedUpdatedAt?)` — copies
 *     `draftFields` into the published columns (AC-9), invalidates the
 *     `"appearance"` cache tag (AC-22), and emits a best-effort audit
 *     entry with the new published values. Same `expectedUpdatedAt`
 *     conflict check as `saveDraft` (AC-33).
 *   - `resetDraft(actorUserId, tErrors, tx?)` — resets `draftFields` to match
 *     the published columns (discard unpublished draft changes).
 *
 * Design: `.ai/plans/brand/implementation.md` §4.
 * Repo:   `backend/db/repo/appearance/appearance-settings.repository.ts` (Task 2.2).
 * Types:  `backend/types/appearance.types.ts` (Task 2.1).
 */

import type { PaletteMode } from "@mui/material/styles";
import { revalidateTag, unstable_cache } from "next/cache";
import { AppearanceSettingsRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  AppearanceFields,
  AppearanceSettingsReturnType,
  AppearanceSettingsRow,
  AppearanceSettingsSubmitInput,
  CreateAuditLogInput,
  DBTransaction,
  PerModeColors,
} from "@/backend/types";
import { sanitizeAppearanceFields } from "@/shared/lib/appearance.helpers";
import type { ErrorsLabels } from "@/shared/locale";
import { parseAppearanceEnvBranding, zAppearanceFields } from "@/shared/schemas/appearance.zod";

/**
 * Cache tag used by `unstable_cache` for the published appearance read path.
 * Invalidated via `revalidateTag` on every successful `publish` call (AC-22).
 *
 * Also invalidated when a branding env-config key (`NEXT_PUBLIC_APP_BRANDING` or
 * `APP_THEME_PRESET`) is overridden via the Settings → Environment Config tab
 * (AC-30) — see {@link revalidateAppearanceCache}.
 */
export const NAME_APPEARANCE = "appearance";

/**
 * Invalidates the SSR appearance cache so the next read picks up new branding.
 *
 * Used by:
 * - {@link AppearanceSettingsService.publish} after copying draft into published
 *   columns (AC-22).
 * - `upsertEnvConfigOverride` / `deleteEnvConfigOverride` in
 *   `environment-config.service.ts` when a branding env-config key changes (AC-30).
 *
 * Next.js 16 `revalidateTag` accepts a `cacheLife` profile for the new entry;
 * `"max"` gives a long-lived entry (stale 5min / revalidate 1month / expire 365d)
 * which is appropriate for appearance settings that only change on publish.
 */
export function revalidateAppearanceCache(): void {
  revalidateTag(NAME_APPEARANCE, "max");
  // Clear the in-memory Tier 1 memo so the next getResolvedAppearance() read
  // reflects the freshly published/invalidated values (AC-22, AC-26).
  resolvedAppearanceMemo = null;
}

/**
 * Stable GraphQL error code for an optimistic-concurrency conflict on the
 * single-row `appearance_settings` entity (AC-33).
 *
 * The frontend customizer matches this code in the Apollo `GraphQLError`
 * `extensions.code` field to decide whether to surface the Reload/Overwrite
 * dialog (vs. a generic error toast).
 */
export const APPEARANCE_CONFLICT_ERROR_CODE = "APPEARANCE_CONFLICT";

/**
 * Thrown by {@link AppearanceSettingsService.saveDraft} and
 * {@link AppearanceSettingsService.publish} when the caller-supplied
 * `expectedUpdatedAt` does not match the current row `updatedAt`
 * (AC-33 — multi-admin optimistic concurrency control).
 *
 * Carries the `serverUpdatedAt` so the frontend can either:
 *   - **Reload** — discard local edits and re-sync from the server, OR
 *   - **Overwrite** — retry the mutation with `expectedUpdatedAt` set to the
 *     server value (or omitted entirely) to force the write through.
 *
 * Mirrors the `SiteContentValidationError` pattern (typed `code` field, named
 * `Error` subclass — see `backend/services/storage/site-content.service.ts`).
 */
export class AppearanceConflictError extends Error {
  /** Stable error code (always {@link APPEARANCE_CONFLICT_ERROR_CODE}). */
  readonly code = APPEARANCE_CONFLICT_ERROR_CODE;
  /** The current server-side `updatedAt` (ISO string) that caused the conflict. */
  readonly serverUpdatedAt: string;

  constructor(serverUpdatedAt: string) {
    super(
      `Appearance settings were modified by another admin (server updatedAt=${serverUpdatedAt}). ` +
        "Reload the draft or overwrite with your changes."
    );
    this.name = "AppearanceConflictError";
    this.serverUpdatedAt = serverUpdatedAt;
  }
}

/**
 * Returns `true` if `err` is an {@link AppearanceConflictError} (AC-33).
 * Used by the Pothos resolver to translate the typed error into a
 * `GraphQLError` with `extensions.code = APPEARANCE_CONFLICT_ERROR_CODE`,
 * and by callers that want to differentiate conflict from other failures.
 */
export function isAppearanceConflictError(err: unknown): err is AppearanceConflictError {
  return err instanceof AppearanceConflictError;
}

/**
 * Asserts the optimistic-concurrency invariant for a write: if `expectedUpdatedAt`
 * is provided AND `existing` is non-null AND its `updatedAt` does not match,
 * throws {@link AppearanceConflictError} (AC-33).
 *
 * When `expectedUpdatedAt` is omitted (e.g. a forced overwrite from the
 * frontend conflict dialog), the check is skipped — this is the documented
 * escape hatch for "Overwrite" in the customizer UI.
 *
 * When `existing` is `null` (first-write seeding path), the check is also
 * skipped — there is no prior version to conflict with.
 */
function assertExpectedUpdatedAt(existing: AppearanceSettingsRow | null, expectedUpdatedAt: string | undefined): void {
  if (expectedUpdatedAt === undefined || existing === null) {
    return;
  }
  if (existing.updatedAt !== expectedUpdatedAt) {
    throw new AppearanceConflictError(existing.updatedAt);
  }
}

/**
 * Preset brand-color lookup — maps each preset id to its atomic
 * `primaryMain` + `secondaryMain` pairs (light + dark). Used to derive
 * {@link DEFAULT_APPEARANCE_FIELDS} from the active preset (via
 * `APP_THEME_PRESET` env var) instead of hardcoding teal/indigo.
 *
 * This is a backend-safe mirror of the frontend preset catalog
 * (`frontend/common/providers/theme/presets/index.ts`). Kept as a
 * plain hex lookup (no MUI imports) so the backend service layer can
 * read it without crossing the frontend/backend boundary.
 */
const PRESET_BRAND_COLORS: Record<
  string,
  { light: { primaryMain: string; secondaryMain: string }; dark: { primaryMain: string; secondaryMain: string } }
> = {
  default: {
    light: { primaryMain: "#0D9488", secondaryMain: "#4F46E5" },
    dark: { primaryMain: "#2DD4BF", secondaryMain: "#818CF8" },
  },
  ocean: {
    light: { primaryMain: "#00838F", secondaryMain: "#0277BD" },
    dark: { primaryMain: "#26C6DA", secondaryMain: "#4FC3F7" },
  },
  emerald: {
    light: { primaryMain: "#2E7D32", secondaryMain: "#558B2F" },
    dark: { primaryMain: "#4CAF50", secondaryMain: "#9CCC65" },
  },
  violet: {
    light: { primaryMain: "#7B1FA2", secondaryMain: "#C2185B" },
    dark: { primaryMain: "#BA68C8", secondaryMain: "#F06292" },
  },
  crimson: {
    light: { primaryMain: "#C62828", secondaryMain: "#EF6C00" },
    dark: { primaryMain: "#EF5350", secondaryMain: "#FFA726" },
  },
  slate: {
    light: { primaryMain: "#455A64", secondaryMain: "#607D8B" },
    dark: { primaryMain: "#78909C", secondaryMain: "#B0BEC5" },
  },
};

/** The active preset's brand colors, read from `APP_THEME_PRESET` env var. */
function getActivePresetBrandColors() {
  const presetId = process.env.APP_THEME_PRESET ?? "default";
  return PRESET_BRAND_COLORS[presetId] ?? PRESET_BRAND_COLORS.default;
}

/**
 * Default appearance fields — derived from the active preset's brand colors.
 *
 * Used to seed the `appearance_settings` row on first access (both published
 * columns and `draft_fields` JSONB are seeded from this). When
 * `APP_THEME_PRESET` is set (e.g. "ocean"), the defaults match that preset's
 * primary/secondary colors instead of the hardcoded teal/indigo.
 */
export const DEFAULT_APPEARANCE_FIELDS: AppearanceFields = {
  colors: getActivePresetBrandColors(),
  logoUrl: null,
  siteName: "Siraj",
  siteTitle: "Siraj",
  siteDescription: "Siraj education management",
  defaultColorScheme: "dark",
};

/**
 * Options for {@link AppearanceSettingsService.getAppearance}.
 */
export interface GetAppearanceOptions {
  /**
   * When `true`, the GraphQL resolver exposes the per-mode `colors` from
   * `draftFields` (admin draft view). When `false`, only published fields are
   * exposed. The service always returns the full row; this flag is a
   * resolver-level concern (accepted here for API symmetry with the GraphQL
   * `draft` query arg).
   */
  draft?: boolean;
  /**
   * When provided AND no row exists, the service upsert-seeds the row with
   * this user stamped on `updatedByUserId` (BOLA defense — decision #20).
   * When omitted, the service returns `null` if no row exists (public read —
   * the caller falls back to {@link DEFAULT_APPEARANCE_FIELDS}).
   */
  actorUserId?: string;
  /** Optional transaction handle for transactional reads. */
  tx?: DBTransaction;
}

/**
 * Asserts that `actorUserId` holds the `SETTINGS_APPEARANCE_MANAGE`
 * permission. Throws a localized `insufficientPermissions` error on failure
 * (decision #5 — write path requires `SETTINGS_APPEARANCE_MANAGE`).
 */
async function assertManagePermission(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SETTINGS_APPEARANCE_MANAGE);
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

/**
 * Reconstructs the published {@link AppearanceFields} projection from a row.
 *
 * The active-mode colors come from the published single-mode columns
 * (`primaryMain` / `secondaryMain`); the inactive-mode colors come from the
 * draft JSONB (best available — the inactive mode is not used by SSR
 * metadata or `server-theme-css.ts`, which only read the active mode).
 *
 * This ensures {@link AppearanceSettingsService.getFirstAppearancePublished}
 * always returns the **published** appearance, even if the admin has saved an
 * unpublished draft (draft saves only update `draft_fields`, not the
 * published columns — AC-8).
 */
function toPublishedAppearanceFields(row: AppearanceSettingsRow): AppearanceFields {
  const activeMode = row.defaultColorScheme;
  const inactiveMode: PaletteMode = activeMode === "light" ? "dark" : "light";
  const activeColors = { primaryMain: row.primaryMain, secondaryMain: row.secondaryMain };
  const inactiveColors = row.draftFields.colors[inactiveMode];
  const colors: PerModeColors =
    activeMode === "light"
      ? { light: activeColors, dark: inactiveColors }
      : { light: inactiveColors, dark: activeColors };
  return {
    colors,
    logoUrl: row.logoUrl,
    siteName: row.siteName,
    siteTitle: row.siteTitle,
    siteDescription: row.siteDescription,
    defaultColorScheme: activeMode,
  };
}

/**
 * Builds an {@link AppearanceSettingsRow} from published + draft fields.
 *
 * `id`, `updatedAt`, and `createdAt` are dummy values — the repo's `upsert`
 * ignores them (the DB manages `id` via `defaultRandom()` and timestamps via
 * `defaultNow()`). `updatedByUserId` is `null` on the row object but is
 * overridden by the `upsert` parameter (BOLA defense — decision #20).
 */
function buildAppearanceRow(published: AppearanceFields, draft: AppearanceFields): AppearanceSettingsRow {
  const activeColors = published.colors[published.defaultColorScheme];
  return {
    id: "",
    primaryMain: activeColors.primaryMain,
    secondaryMain: activeColors.secondaryMain,
    logoUrl: published.logoUrl,
    siteName: published.siteName,
    siteTitle: published.siteTitle,
    siteDescription: published.siteDescription,
    defaultColorScheme: published.defaultColorScheme,
    draftFields: draft,
    updatedByUserId: null,
    updatedAt: "",
    createdAt: "",
  };
}

/**
 * Seeds the `appearance_settings` row with {@link DEFAULT_APPEARANCE_FIELDS}
 * for both published columns and `draft_fields`. Returns the seeded row.
 *
 * `actorUserId` is stamped on `updatedByUserId` (BOLA defense — decision #20).
 */
async function seedDefaults(actorUserId: string, tx?: DBTransaction): Promise<AppearanceSettingsRow> {
  return AppearanceSettingsRepository.upsert(
    buildAppearanceRow(DEFAULT_APPEARANCE_FIELDS, DEFAULT_APPEARANCE_FIELDS),
    actorUserId,
    tx
  );
}

/**
 * Best-effort audit emit for the `publish` mutation — never throws.
 *
 * Records an `UPDATE` audit entry with the new published values in
 * `newState`. Uses entityType `"SYSTEM"` (a dedicated `"APPEARANCE"` type is
 * recommended as a follow-up — see outcome §"Cross-file dependencies").
 */
async function emitPublishAudit(
  actorUserId: string,
  published: AppearanceSettingsRow,
  tx?: DBTransaction
): Promise<void> {
  const input: CreateAuditLogInput = {
    actorUserId,
    actorType: "USER",
    entityType: "SYSTEM",
    entityId: published.id,
    action: "UPDATE",
    newState: {
      primaryMain: published.primaryMain,
      secondaryMain: published.secondaryMain,
      logoUrl: published.logoUrl,
      siteName: published.siteName,
      siteTitle: published.siteTitle,
      siteDescription: published.siteDescription,
      defaultColorScheme: published.defaultColorScheme,
    },
  };

  try {
    await AuditService.createManyAuditLogs([input], tx);
  } catch (error) {
    logger.error(
      `appearance-service: audit log failed for publish on "${published.id}". ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Cached published-appearance read for SSR (`generateMetadata`,
 * `server-theme-css.ts`). Tagged `"appearance"` so `revalidateTag` on
 * `publish` invalidates the cache (AC-22).
 *
 * Returns `null` if no row exists — the caller falls back to
 * {@link DEFAULT_APPEARANCE_FIELDS}. Does NOT seed (no user context on SSR;
 * seeding happens on the first admin read via `getAppearance`).
 */
const getCachedPublishedAppearance = unstable_cache(
  async (): Promise<AppearanceFields | null> => {
    const row = await AppearanceSettingsRepository.get();
    return row ? toPublishedAppearanceFields(row) : null;
  },
  ["appearance-settings-published"],
  { tags: [NAME_APPEARANCE], revalidate: 3600 }
);

/**
 * In-memory TTL memo for {@link AppearanceSettingsService.getResolvedAppearance}.
 *
 * Tier 1 of the 4-tier resolution ladder — bypasses the `unstable_cache` (DB)
 * layer entirely on warm hits, keeping p99 read latency to a single property
 * lookup. TTL is short (15s) so a `revalidateTag("appearance")` on `publish`
 * (which invalidates the `unstable_cache` layer) is reflected here within
 * one TTL window without needing a manual invalidation hook (the in-memory
 * layer has no Next.js cache binding).
 *
 * Reset to `null` in {@link revalidateAppearanceCache} so the very next read
 * after a publish (or env-config override — AC-30) picks up the freshly
 * published values.
 */
const RESOLVED_APPEARANCE_TTL_MS = 15_000;
let resolvedAppearanceMemo: { value: AppearanceFields; expiresAt: number } | null = null;

/**
 * Process-wide memo of the parsed `process.env.NEXT_PUBLIC_APP_BRANDING`
 * payload. Env vars are immutable at runtime in Next.js, so the parse +
 * validate cost is paid exactly once per process. Failures (unset / invalid
 * JSON / schema-invalid) are also memoised (returning `null`) to avoid
 * log-spam on every SSR request.
 */
let envBrandingMemo: { resolved: AppearanceFields | null } | null = null;

/**
 * Parses + validates `process.env.NEXT_PUBLIC_APP_BRANDING` as
 * {@link AppearanceFields} (AC-27 — Tier 3 of the resolution ladder).
 *
 * Returns `null` when the env var is unset, blank, unparseable JSON, or
 * fails Zod schema validation. The caller ({@link getResolvedAppearance})
 * falls back to {@link DEFAULT_APPEARANCE_FIELDS} on `null`.
 *
 * Delegates the JSON parse + Zod validate to {@link parseAppearanceEnvBranding}
 * (decision §22, AC-38 — single-source Zod validation shared with the
 * `saveDraft` JSONB boundary). The result is memoised in
 * {@link envBrandingMemo} so repeated reads are O(1).
 */
function readAppearanceFromEnv(): AppearanceFields | null {
  if (envBrandingMemo) {
    return envBrandingMemo.resolved;
  }
  const raw = process.env.NEXT_PUBLIC_APP_BRANDING;
  if (!raw || raw.trim() === "") {
    envBrandingMemo = { resolved: null };
    return null;
  }
  // parseAppearanceEnvBranding never throws — it returns the fallback
  // reference on JSON.parse failure or Zod validation failure. We detect
  // the failure case by reference equality (the helper returns the *same*
  // fallback reference, not a structural clone).
  const resolved = parseAppearanceEnvBranding(raw, DEFAULT_APPEARANCE_FIELDS);
  if (resolved === DEFAULT_APPEARANCE_FIELDS) {
    logger.warn(
      "appearance-service: NEXT_PUBLIC_APP_BRANDING is set but could not be parsed or validated — falling back to DEFAULT_APPEARANCE_FIELDS"
    );
    envBrandingMemo = { resolved: null };
    return null;
  }
  envBrandingMemo = { resolved };
  return resolved;
}

export namespace AppearanceSettingsService {
  /**
   * Returns the single `appearance_settings` row (full row including
   * `draftFields`), or `null` if no row exists and no `actorUserId` was
   * supplied for seeding.
   *
   * When `actorUserId` is provided AND no row exists, the row is upsert-seeded
   * with {@link DEFAULT_APPEARANCE_FIELDS} (published + draft) before
   * returning. This is the "first access" seeding path (decision #7,
   * AC-2).
   *
   * The `draft` flag is accepted for API symmetry with the GraphQL `draft`
   * query arg but is not used by the service — the resolver controls draft
   * field exposure based on permissions.
   */
  export async function getAppearance(options?: GetAppearanceOptions): Promise<AppearanceSettingsReturnType | null> {
    const { actorUserId, tx } = options ?? {};
    const existing = await AppearanceSettingsRepository.get(tx);
    if (existing) {
      return existing;
    }
    if (!actorUserId) {
      return null;
    }
    return seedDefaults(actorUserId, tx);
  }

  /**
   * Cached SSR read — returns the **published** {@link AppearanceFields}
   * (active-mode colors from the published columns), or `null` if no row
   * exists.
   *
   * Wrapped in `unstable_cache` with tag `"appearance"` (AC-22). The cache
   * is invalidated on every successful `publish` call via `revalidateTag`.
   *
   * Does NOT seed — SSR has no user context. The caller (`generateMetadata`,
   * `server-theme-css.ts`) falls back to {@link DEFAULT_APPEARANCE_FIELDS}
   * when this returns `null`.
   */
  export async function getFirstAppearancePublished(): Promise<AppearanceFields | null> {
    return getCachedPublishedAppearance();
  }

  /**
   * Tiered SSR appearance resolution (AC-26, AC-27, decision #14).
   *
   * Resolution ladder (first non-null wins):
   *   1. **In-memory TTL memo** ({@link resolvedAppearanceMemo}) — bypasses
   *      the `unstable_cache` layer entirely on warm hits. 15s TTL keeps p99
   *      read latency at a single property lookup while bounding staleness
   *      after a `revalidateTag("appearance")` on `publish`.
   *   2. **`unstable_cache` DB read** ({@link getFirstAppearancePublished}) —
   *      returns the published {@link AppearanceFields}, or `null` when no
   *      row exists yet (e.g. before the first admin read seeds the row).
   *   3. **ENV fallback** ({@link readAppearanceFromEnv}) — parses
   *      `process.env.NEXT_PUBLIC_APP_BRANDING` and Zod-validates the result.
   *      Covers cold-start / no-DB scenarios (CI prerender, bootstrap before
   *      first publish). Returns `null` when unset or invalid (the helper
   *      logs a domain warning once per process on the invalid case).
   *   4. **Static defaults** ({@link DEFAULT_APPEARANCE_FIELDS}) — the
   *      canonical theme snapshot; always available, never throws.
   *
   * The winning value is memoised in {@link resolvedAppearanceMemo} with a
   * fresh expiry so subsequent reads within the TTL skip tiers 2–4. The memo
   * is cleared by {@link revalidateAppearanceCache} on `publish` and on
   * branding-related env-config overrides (AC-30) so the very next read
   * reflects the freshly published / invalidated values.
   *
   * Never returns `null`, never throws — safe to call from `generateMetadata`,
   * `server-theme-css.ts`, and any other SSR hot path without a try/catch.
   */
  export async function getResolvedAppearance(): Promise<AppearanceFields> {
    // Tier 1 — in-memory TTL memo (hot path; skips DB + ENV entirely).
    const memo = resolvedAppearanceMemo;
    if (memo && memo.expiresAt > Date.now()) {
      return memo.value;
    }

    // Tier 2 — `unstable_cache` DB read (invalidated by `revalidateTag` on publish).
    const published = await getFirstAppearancePublished();
    if (published) {
      resolvedAppearanceMemo = {
        value: published,
        expiresAt: Date.now() + RESOLVED_APPEARANCE_TTL_MS,
      };
      return published;
    }

    // Tier 3 — ENV fallback (`NEXT_PUBLIC_APP_BRANDING`).
    const fromEnv = readAppearanceFromEnv();
    if (fromEnv) {
      resolvedAppearanceMemo = {
        value: fromEnv,
        expiresAt: Date.now() + RESOLVED_APPEARANCE_TTL_MS,
      };
      return fromEnv;
    }

    // Tier 4 — static defaults (canonical theme snapshot).
    resolvedAppearanceMemo = {
      value: DEFAULT_APPEARANCE_FIELDS,
      expiresAt: Date.now() + RESOLVED_APPEARANCE_TTL_MS,
    };
    return DEFAULT_APPEARANCE_FIELDS;
  }

  /**
   * Saves a draft — replaces `draftFields` with `input`. Published columns
   * are preserved unchanged (AC-8).
   *
   * Requires `SETTINGS_APPEARANCE_MANAGE` (decision #5). On first access (no
   * row), seeds with {@link DEFAULT_APPEARANCE_FIELDS} for published and
   * `input` for draft.
   *
   * `actorUserId` is stamped on `updatedByUserId` (BOLA defense — decision #20).
   */
  export async function saveDraft(
    input: AppearanceSettingsSubmitInput,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction,
    expectedUpdatedAt?: string
  ): Promise<AppearanceSettingsReturnType> {
    await assertManagePermission(actorUserId, tErrors);

    // AC-34 — defense-in-depth input sanitization BEFORE schema validation.
    // Normalizes hex colors (lowercase, strip whitespace, ensure `#` prefix),
    // strips HTML tags from `siteName`/`siteTitle`, and runs `siteDescription`
    // through DOMPurify to neutralize XSS vectors (`<script>`, `onload=`,
    // `javascript:` URIs). This runs first so the Zod validator below sees
    // already-clean input — sanitize early, validate late, persist only
    // validated-and-sanitized payloads. See `shared/lib/appearance.helpers.ts`.
    const sanitizedInput = sanitizeAppearanceFields(input);

    // AC-38 — defense-in-depth Zod re-validation on the JSONB boundary.
    // The GraphQL input type already enforces shape, but this guards against
    // a stale DB row, a buggy resolver, or a direct service caller bypassing
    // GraphQL. On validation failure, log a domain warning and fall back to
    // `DEFAULT_APPEARANCE_FIELDS` (never throw — the GraphQL layer should
    // have already rejected; throwing here would create an inconsistent UX).
    const parseResult = zAppearanceFields.safeParse(sanitizedInput);
    if (!parseResult.success) {
      logger.warn(
        `appearance-service: saveDraft input failed Zod validation; falling back to defaults. Issues: ${JSON.stringify(parseResult.error.issues)}`
      );
    }
    const safeInput: AppearanceFields = parseResult.success ? parseResult.data : DEFAULT_APPEARANCE_FIELDS;

    const existing = await AppearanceSettingsRepository.get(tx);

    // AC-33 — optimistic concurrency check (skipped on first-write seeding path
    // or when the caller explicitly omits `expectedUpdatedAt`).
    assertExpectedUpdatedAt(existing, expectedUpdatedAt);

    if (!existing) {
      // First write — seed published with defaults, draft with input.
      return AppearanceSettingsRepository.upsert(
        buildAppearanceRow(DEFAULT_APPEARANCE_FIELDS, safeInput),
        actorUserId,
        tx
      );
    }

    // Row exists — preserve published columns, replace draftFields (AC-8).
    const preservedRow: AppearanceSettingsRow = {
      ...existing,
      draftFields: safeInput,
    };
    return AppearanceSettingsRepository.upsert(preservedRow, actorUserId, tx);
  }

  /**
   * Publishes the draft — copies `draftFields` into the published columns
   * (AC-9), invalidates the `"appearance"` cache tag (AC-22), and emits a
   * best-effort audit entry with the new published values.
   *
   * Requires `SETTINGS_APPEARANCE_MANAGE` (decision #5). On first access (no
   * row), seeds with {@link DEFAULT_APPEARANCE_FIELDS} before publishing.
   *
   * Optimistic concurrency (AC-33): when `expectedUpdatedAt` is provided, the
   * call throws {@link AppearanceConflictError} if the current row `updatedAt`
   * does not match. Omit `expectedUpdatedAt` to force the publish through.
   */
  export async function publish(
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction,
    expectedUpdatedAt?: string
  ): Promise<AppearanceSettingsReturnType> {
    await assertManagePermission(actorUserId, tErrors);

    let existing = await AppearanceSettingsRepository.get(tx);

    // AC-33 — optimistic concurrency check (skipped on the first-publish
    // seeding path or when the caller explicitly omits `expectedUpdatedAt`).
    assertExpectedUpdatedAt(existing, expectedUpdatedAt);

    // First publish — seed with defaults if no row exists yet, then publish.
    existing ??= await seedDefaults(actorUserId, tx);

    const published = await AppearanceSettingsRepository.publishDraft(existing.draftFields, actorUserId, tx);

    // Invalidate the SSR cache so the next read picks up the new published values (AC-22).
    // Shared with the env-config override path (AC-30) via `revalidateAppearanceCache`.
    revalidateAppearanceCache();

    // Best-effort audit — never throws (mirrors site-content.service.ts pattern).
    await emitPublishAudit(actorUserId, published, tx);

    return published;
  }

  /**
   * Resets the draft — sets `draftFields` to match the published columns
   * (discard unpublished draft changes).
   *
   * Requires `SETTINGS_APPEARANCE_MANAGE` (decision #5). On first access (no
   * row), seeds with {@link DEFAULT_APPEARANCE_FIELDS} (draft == published ==
   * defaults) and returns.
   *
   * The active-mode colors come from the published single-mode columns; the
   * inactive-mode colors are preserved from the existing draft (no published
   * source for the inactive mode — see {@link toPublishedAppearanceFields}).
   */
  export async function resetDraft(
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<AppearanceSettingsReturnType> {
    await assertManagePermission(actorUserId, tErrors);

    const existing = await AppearanceSettingsRepository.get(tx);

    if (!existing) {
      // First reset — seed with defaults (draft == published == defaults).
      return seedDefaults(actorUserId, tx);
    }

    // Reset draft to match published columns.
    const resetRow: AppearanceSettingsRow = {
      ...existing,
      draftFields: toPublishedAppearanceFields(existing),
    };
    return AppearanceSettingsRepository.upsert(resetRow, actorUserId, tx);
  }
}
