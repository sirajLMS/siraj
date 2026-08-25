// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AppearanceSettingsPothosObject,
  assertCanManageAppearance,
  assertCanViewAppearanceSettings,
  resolveAppearanceErrors,
} from "@/backend/graphql/pothos/system/site-appearance-settings.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { AppearanceSettingsService } from "@/backend/services";

gqlSchemaBuilder.queryField("appearanceSettings", t =>
  t.field({
    type: AppearanceSettingsPothosObject,
    nullable: true,
    authScopes: { loggedIn: true },
    args: {
      draft: t.arg.boolean({ required: false, defaultValue: false }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = resolveAppearanceErrors(ctx);
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
