// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  assertCanViewGeneralSettings,
  isGeneralSettingKey,
  resolveErrors,
  SystemSettingPothosObject,
} from "@/backend/graphql/pothos/system/general-settings.pothos";
import { SystemSettingsService } from "@/backend/services";

gqlSchemaBuilder.queryField("systemSettings", t =>
  t.field({
    type: [SystemSettingPothosObject],
    // Read access = loggedIn here; the effective SETTINGS_VIEW /
    // SETTINGS_EDIT_GENERAL gate lives in assertCanViewGeneralSettings below.
    // The authScopes plugin only supports AND-composed single permissions, so
    // the OR view rule cannot be expressed declaratively — keep the resolver
    // guard as the source of truth.
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const tErrors = resolveErrors(ctx);
      assertCanViewGeneralSettings(ctx, tErrors);

      const settings = await SystemSettingsService.listAllSettings();
      return settings.filter(setting => isGeneralSettingKey(setting.key));
    },
  })
);

gqlSchemaBuilder.queryField("systemSetting", t =>
  t.field({
    type: SystemSettingPothosObject,
    nullable: true,
    // Same as systemSettings: loggedIn declared here; the SETTINGS_VIEW /
    // SETTINGS_EDIT_GENERAL OR gate is enforced by assertCanViewGeneralSettings.
    authScopes: { loggedIn: true },
    args: {
      key: t.arg.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = resolveErrors(ctx);
      assertCanViewGeneralSettings(ctx, tErrors);

      if (!isGeneralSettingKey(args.key)) {
        return null;
      }

      return SystemSettingsService.getSettingByKey(args.key);
    },
  })
);
