// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  isGeneralSettingKey,
  resolveGeneralSettingsAuthCtx,
  SystemSettingPothosObject,
  SystemSettingUpsertInputPothos,
} from "@/backend/graphql/pothos/system/general-settings.pothos";
import { SystemSettingsService } from "@/backend/services";

gqlSchemaBuilder.mutationField("upsertSystemSetting", t =>
  t.field({
    type: SystemSettingPothosObject,
    authScopes: { $all: { permission: AppPermission.SETTINGS_EDIT_GENERAL, notImpersonating: true } },
    args: {
      input: t.arg({ type: SystemSettingUpsertInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveGeneralSettingsAuthCtx(ctx);

      if (!isGeneralSettingKey(args.input.key)) {
        throw new GraphQLError(tErrors.invalidInput, {
          extensions: { code: "EENV_SCOPE_REJECTED" },
        });
      }

      return SystemSettingsService.upsertGenericSetting(
        {
          key: args.input.key,
          value: args.input.value,
          dataType: args.input.dataType ?? undefined,
          description: args.input.description ?? undefined,
          category: args.input.category ?? undefined,
        },
        actorUserId,
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteSystemSetting", t =>
  t.field({
    type: "Boolean",
    authScopes: { $all: { permission: AppPermission.SETTINGS_EDIT_GENERAL, notImpersonating: true } },
    args: {
      key: t.arg.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveGeneralSettingsAuthCtx(ctx);

      if (!isGeneralSettingKey(args.key)) {
        throw new GraphQLError(tErrors.invalidInput, {
          extensions: { code: "EENV_SCOPE_REJECTED" },
        });
      }

      await SystemSettingsService.deleteSettingByKey(args.key, actorUserId, tErrors);
      return true;
    },
  })
);
