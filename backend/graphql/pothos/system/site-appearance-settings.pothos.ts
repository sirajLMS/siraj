/**
 * Site Appearance Customization — Pothos Resolvers
 *
 * GraphQL schema for the single-row `appearance_settings` entity. Exposes:
 *   - `AppearanceSettings` object type (full row including nested
 *     `draftFields`) — used by the admin customizer + Apollo cache
 *     normalization (id field).
 *   - `appearanceSettings(draft: Boolean = false)` query — gated by
 *     `SETTINGS_VIEW` (or superAdmin) for `draft=false`, and by
 *     `SETTINGS_APPEARANCE_MANAGE` for `draft=true` (admin draft view).
 *   - `saveAppearanceDraft`, `publishAppearance`, `resetAppearanceDraft`
 *     mutations — all gated by `SETTINGS_APPEARANCE_MANAGE` +
 *     `notImpersonating: true`.
 *
 * Design: `.ai/plans/brand/implementation.md` §5.
 * Service: `backend/services/appearance/appearance-settings.service.ts` (Task 2.3).
 * Types:  `backend/types/appearance.types.ts` (Task 2.1).
 *
 * NOTE: `defaultColorScheme` is exposed as a plain `String!` (not a Pothos
 * enum) because `PaletteMode` is a MUI string-union type alias, not a
 * TypeScript `enum`. Per `backend/graphql/pothos/AGENTS.md`, GraphQL enums
 * MUST be backed by a real `enum` in `backend/enum/`. A follow-up task should
 * create a canonical `PaletteMode` enum and migrate this field — see the
 * outcome file's "Carry-Forward" section.
 */

import type { PaletteMode } from "@mui/material/styles";
import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  APPEARANCE_CONFLICT_ERROR_CODE,
  AppearanceSettingsService,
  isAppearanceConflictError,
} from "@/backend/services";
import type {
  AppearanceFields,
  AppearanceSettingsReturnType,
  AppearanceSettingsSubmitInput,
  PerModeColors,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

// ─── Object Types ─────────────────────────────────────────────────────────────

/**
 * Brand color pair for a single mode (primary + secondary main colors).
 * Used as a nested field on `AppearanceColors` and `AppearanceColorsInput`.
 */
const AppearanceColorPairRef = gqlSchemaBuilder.objectRef<{
  primaryMain: string;
  secondaryMain: string;
}>("AppearanceColorPair");

export const AppearanceColorPairPothosObject = AppearanceColorPairRef.implement({
  description: "A pair of brand colors (primary + secondary) for a single mode.",
  fields: t => ({
    primaryMain: t.exposeString("primaryMain"),
    secondaryMain: t.exposeString("secondaryMain"),
  }),
});

/**
 * Per-mode brand colors (light + dark pairs). Nested under `AppearanceFields`.
 */
const AppearanceColorsRef = gqlSchemaBuilder.objectRef<PerModeColors>("AppearanceColors");

export const AppearanceColorsPothosObject = AppearanceColorsRef.implement({
  description: "Per-mode brand colors (light + dark).",
  fields: t => ({
    light: t.expose("light", { type: AppearanceColorPairPothosObject }),
    dark: t.expose("dark", { type: AppearanceColorPairPothosObject }),
  }),
});

/**
 * Full appearance field bundle — the shape of `draft_fields` JSONB. Used as
 * the nested `draftFields` field on `AppearanceSettings`.
 */
const AppearanceFieldsRef = gqlSchemaBuilder.objectRef<AppearanceFields>("AppearanceFields");

export const AppearanceFieldsPothosObject = AppearanceFieldsRef.implement({
  description: "Full appearance field bundle (per-mode colors + scalar brand fields).",
  fields: t => ({
    colors: t.expose("colors", { type: AppearanceColorsPothosObject }),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    siteName: t.exposeString("siteName"),
    siteTitle: t.exposeString("siteTitle"),
    siteDescription: t.exposeString("siteDescription"),
    defaultColorScheme: t.exposeString("defaultColorScheme"),
  }),
});

/**
 * Canonical `AppearanceSettings` object type — exposes the full
 * {@link AppearanceSettingsReturnType} row including `id` (Apollo cache
 * normalization per `backend/graphql/AGENTS.md`).
 */
const AppearanceSettingsRef = gqlSchemaBuilder.objectRef<AppearanceSettingsReturnType>("AppearanceSettings");

export const AppearanceSettingsPothosObject = AppearanceSettingsRef.implement({
  description: "Site appearance settings (single global row, no tenant scoping).",
  fields: t => ({
    id: t.exposeString("id"),
    primaryMain: t.exposeString("primaryMain"),
    secondaryMain: t.exposeString("secondaryMain"),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    siteName: t.exposeString("siteName"),
    siteTitle: t.exposeString("siteTitle"),
    siteDescription: t.exposeString("siteDescription"),
    defaultColorScheme: t.exposeString("defaultColorScheme"),
    draftFields: t.expose("draftFields", { type: AppearanceFieldsPothosObject }),
    updatedByUserId: t.exposeString("updatedByUserId", { nullable: true }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

// ─── Input Types ──────────────────────────────────────────────────────────────

/**
 * Input pair of brand colors for a single mode. Mirrors the inner shape of
 * {@link PerModeColors.light} / {@link PerModeColors.dark}.
 */
const AppearanceColorPairInputRef = gqlSchemaBuilder
  .inputRef<{ primaryMain: string; secondaryMain: string }>("AppearanceColorPairInput")
  .implement({
    description: "Input pair of brand colors (primary + secondary) for a single mode.",
    fields: t => ({
      primaryMain: t.string({ required: true, directives: { constraint: { maxLength: 32 } } }),
      secondaryMain: t.string({ required: true, directives: { constraint: { maxLength: 32 } } }),
    }),
  });

/**
 * Input for per-mode brand colors. Mirrors {@link PerModeColors}.
 */
const AppearanceColorsInputRef = gqlSchemaBuilder.inputRef<PerModeColors>("AppearanceColorsInput").implement({
  description: "Input for per-mode brand colors (light + dark).",
  fields: t => ({
    light: t.field({ type: AppearanceColorPairInputRef, required: true }),
    dark: t.field({ type: AppearanceColorPairInputRef, required: true }),
  }),
});

/**
 * GraphQL input shape for the `saveAppearanceDraft` mutation. Mirrors
 * {@link AppearanceSettingsSubmitInput} (= {@link AppearanceFields}) with two
 * field-type adjustments required by Pothos input semantics:
 *   - `defaultColorScheme` is `string` (not `PaletteMode`) because there is
 *     no canonical `PaletteMode` enum registered in `backend/enum/`. The
 *     resolver coerces it to `PaletteMode` via {@link coercePaletteMode}.
 *   - `logoUrl` is `string | null | undefined` (omittable + nullable). The
 *     resolver normalizes `undefined` to `null` to match the service shape.
 */
type AppearanceDraftInputShape = Omit<AppearanceSettingsSubmitInput, "defaultColorScheme" | "logoUrl"> & {
  defaultColorScheme: string;
  logoUrl?: string | null;
};

export const AppearanceDraftInputPothosRef = gqlSchemaBuilder
  .inputRef<AppearanceDraftInputShape>("AppearanceDraftInput")
  .implement({
    description: "Input for the saveAppearanceDraft mutation (full draft field bundle).",
    fields: t => ({
      colors: t.field({ type: AppearanceColorsInputRef, required: true }),
      logoUrl: t.string({ required: false, directives: { constraint: { maxLength: 2048 } } }),
      siteName: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
      siteTitle: t.string({ required: true, directives: { constraint: { maxLength: 200 } } }),
      siteDescription: t.string({ required: true, directives: { constraint: { maxLength: 500 } } }),
      defaultColorScheme: t.string({ required: true, directives: { constraint: { maxLength: 10 } } }),
    }),
  });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveErrors(ctx: BaseContext): ErrorsLabels {
  return ctx.t().errorsTranslations;
}

function canViewAppearanceSettings(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.SETTINGS_VIEW) ||
    ctx.permissions.includes(AppPermission.SETTINGS_APPEARANCE_MANAGE)
  );
}

function assertCanViewAppearanceSettings(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewAppearanceSettings(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

function assertCanManageAppearance(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!ctx.isSuperAdmin && !ctx.permissions.includes(AppPermission.SETTINGS_APPEARANCE_MANAGE)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

/**
 * Wraps a service-layer appearance mutation in a try/catch that translates
 * an AppearanceConflictError into a GraphQL error with
 * `extensions.code = APPEARANCE_CONFLICT_ERROR_CODE` (AC-33).
 *
 * The frontend customizer matches this code on the Apollo GraphQLError
 * `extensions` field to surface the Reload/Overwrite dialog instead of a
 * generic error toast. The `serverUpdatedAt` is included so the frontend
 * can immediately retry with the new value (Overwrite) without an extra
 * refetch round-trip.
 */
async function runAppearanceMutation<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isAppearanceConflictError(error)) {
      throw new GraphQLError(error.message, {
        extensions: {
          code: APPEARANCE_CONFLICT_ERROR_CODE,
          serverUpdatedAt: error.serverUpdatedAt,
        },
      });
    }
    throw error;
  }
}

/**
 * Coerces a GraphQL `String!` value to {@link PaletteMode}. Defaults to
 * `"dark"` for invalid input (the GraphQL `maxLength: 10` constraint prevents
 * long garbage strings; a follow-up enum migration will eliminate this
 * coercion — see the outcome file's "Carry-Forward" section).
 */
function coercePaletteMode(value: string): PaletteMode {
  return value === "light" ? "light" : "dark";
}

/**
 * Converts the GraphQL input shape ({@link AppearanceDraftInputShape}) to the
 * service-layer shape ({@link AppearanceSettingsSubmitInput}). Normalizes
 * `logoUrl` (`undefined` → `null`) and coerces `defaultColorScheme` to
 * {@link PaletteMode} via {@link coercePaletteMode}.
 */
function toAppearanceSubmitInput(input: AppearanceDraftInputShape): AppearanceSettingsSubmitInput {
  return {
    colors: input.colors,
    logoUrl: input.logoUrl ?? null,
    siteName: input.siteName,
    siteTitle: input.siteTitle,
    siteDescription: input.siteDescription,
    defaultColorScheme: coercePaletteMode(input.defaultColorScheme),
  };
}

// ─── Query ────────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("appearanceSettings", t =>
  t.field({
    type: AppearanceSettingsPothosObject,
    nullable: true,
    authScopes: { loggedIn: true },
    args: {
      draft: t.arg.boolean({ required: false, defaultValue: false }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = resolveErrors(ctx);
      await requireAuth(ctx);

      // `draft=true` requests the live (possibly unpublished) draft state —
      // requires SETTINGS_APPEARANCE_MANAGE (decision #5). `draft=false`
      // (default) is the general admin view — SETTINGS_VIEW suffices.
      if (args.draft) {
        assertCanManageAppearance(ctx, tErrors);
      } else {
        assertCanViewAppearanceSettings(ctx, tErrors);
      }

      const actorUserId = ctx.user?.id;
      return AppearanceSettingsService.getAppearance({ actorUserId, draft: args.draft ?? false });
    },
    description:
      "Returns the single `appearance_settings` row (or null if unseeded). " +
      "Pass `draft: true` to indicate an admin draft-view request — requires " +
      "SETTINGS_APPEARANCE_MANAGE. The service always returns the full row " +
      "(including draftFields); `draft` is a permission-gate marker.",
  })
);

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("saveAppearanceDraft", t =>
  t.field({
    type: AppearanceSettingsPothosObject,
    authScopes: {
      permission: AppPermission.SETTINGS_APPEARANCE_MANAGE,
      notImpersonating: true,
    },
    args: {
      input: t.arg({ type: AppearanceDraftInputPothosRef, required: true }),
      // AC-33 - optional optimistic-concurrency guard. When provided, the
      // service throws AppearanceConflictError if the current row updatedAt
      // does not match. Omit to force the write (frontend Overwrite path).
      expectedUpdatedAt: t.arg.string({ required: false, directives: { constraint: { maxLength: 64 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = resolveErrors(ctx);
      const input = toAppearanceSubmitInput(args.input);
      const expectedUpdatedAt = args.expectedUpdatedAt ?? undefined;
      return runAppearanceMutation(() =>
        AppearanceSettingsService.saveDraft(input, actorUserId, tErrors, undefined, expectedUpdatedAt)
      );
    },
    description:
      "Saves a draft — replaces `draftFields` with `input`. Published " +
      "columns are preserved unchanged (AC-8). Requires " +
      "SETTINGS_APPEARANCE_MANAGE. Pass `expectedUpdatedAt` for optimistic " +
      "concurrency control (AC-33).",
  })
);

gqlSchemaBuilder.mutationField("publishAppearance", t =>
  t.field({
    type: AppearanceSettingsPothosObject,
    authScopes: {
      permission: AppPermission.SETTINGS_APPEARANCE_MANAGE,
      notImpersonating: true,
    },
    args: {
      // AC-33 - same optimistic-concurrency guard as saveAppearanceDraft.
      expectedUpdatedAt: t.arg.string({ required: false, directives: { constraint: { maxLength: 64 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = resolveErrors(ctx);
      const expectedUpdatedAt = args.expectedUpdatedAt ?? undefined;
      return runAppearanceMutation(() =>
        AppearanceSettingsService.publish(actorUserId, tErrors, undefined, expectedUpdatedAt)
      );
    },
    description:
      "Publishes the draft — copies `draftFields` into the published " +
      "columns (AC-9) and invalidates the appearance SSR cache (AC-22). " +
      "Requires SETTINGS_APPEARANCE_MANAGE. Pass `expectedUpdatedAt` for " +
      "optimistic concurrency control (AC-33).",
  })
);

gqlSchemaBuilder.mutationField("resetAppearanceDraft", t =>
  t.field({
    type: AppearanceSettingsPothosObject,
    authScopes: {
      permission: AppPermission.SETTINGS_APPEARANCE_MANAGE,
      notImpersonating: true,
    },
    resolve: async (_root, _args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = resolveErrors(ctx);
      return AppearanceSettingsService.resetDraft(actorUserId, tErrors);
    },
    description:
      "Resets the draft — sets `draftFields` to match the published " +
      "columns (discard unpublished draft changes). Requires " +
      "SETTINGS_APPEARANCE_MANAGE.",
  })
);
