// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AppearanceDraftInputPothosRef,
  AppearanceSettingsPothosObject,
  resolveAppearanceErrors,
  runAppearanceMutation,
  toAppearanceSubmitInput,
} from "@/backend/graphql/pothos/system/site-appearance-settings.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { AppearanceSettingsService } from "@/backend/services";

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
      const tErrors = resolveAppearanceErrors(ctx);
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
      const tErrors = resolveAppearanceErrors(ctx);
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
      const tErrors = resolveAppearanceErrors(ctx);
      return AppearanceSettingsService.resetDraft(actorUserId, tErrors);
    },
    description:
      "Resets the draft — sets `draftFields` to match the published " +
      "columns (discard unpublished draft changes). Requires " +
      "SETTINGS_APPEARANCE_MANAGE.",
  })
);
