import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SystemSettingCategoryPothos, SystemSettingDataTypePothos } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { SystemSettingsService } from "@/backend/services";
import type { SystemSettingSelectType, SystemSettingUpsertInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

const ENV_SETTING_KEY_PREFIX = "env::";

function resolveErrors(ctx: BaseContext): ErrorsLabels {
  return ctx.t().errorsTranslations;
}

function canViewGeneralSettings(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.SETTINGS_VIEW) ||
    ctx.permissions.includes(AppPermission.SETTINGS_EDIT_GENERAL)
  );
}

function assertCanViewGeneralSettings(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewGeneralSettings(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

function isGeneralSettingKey(key: string): boolean {
  return !key.startsWith(ENV_SETTING_KEY_PREFIX);
}

async function resolveAuthCtx(ctx: BaseContext): Promise<{ actorUserId: string; tErrors: ErrorsLabels }> {
  const actorUserId = await requireAuth(ctx);
  return { actorUserId, tErrors: resolveErrors(ctx) };
}

const SystemSettingRef = gqlSchemaBuilder.objectRef<SystemSettingSelectType>("SystemSetting");

export const SystemSettingPothosObject = SystemSettingRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: setting => setting.key,
    }),
    key: t.exposeString("key"),
    value: t.exposeString("value"),
    dataType: t.expose("dataType", { type: SystemSettingDataTypePothos }),
    description: t.exposeString("description"),
    category: t.expose("category", { type: SystemSettingCategoryPothos }),
    updatedByUserId: t.exposeString("updatedByUserId", { nullable: true }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const SystemSettingUpsertInputPothos = gqlSchemaBuilder
  .inputRef<SystemSettingUpsertInput>("SystemSettingUpsertInput")
  .implement({
    fields: t => ({
      key: t.string({ required: true }),
      value: t.string({ required: true }),
      dataType: t.field({ type: SystemSettingDataTypePothos, required: false }),
      description: t.string({ required: false }),
      category: t.field({ type: SystemSettingCategoryPothos, required: false }),
    }),
  });

gqlSchemaBuilder.queryField("systemSettings", t =>
  t.field({
    type: [SystemSettingPothosObject],
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
    authScopes: { loggedIn: true },
    args: {
      key: t.arg.string({ required: true }),
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

gqlSchemaBuilder.mutationField("upsertSystemSetting", t =>
  t.field({
    type: SystemSettingPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_EDIT_GENERAL, notImpersonating: true },
    args: {
      input: t.arg({ type: SystemSettingUpsertInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);

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
    authScopes: { permission: AppPermission.SETTINGS_EDIT_GENERAL, notImpersonating: true },
    args: {
      key: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);

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
