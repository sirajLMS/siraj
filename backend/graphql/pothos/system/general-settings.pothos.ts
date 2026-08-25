import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SystemSettingCategoryPothos, SystemSettingDataTypePothos } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import type { SystemSettingSelectType, SystemSettingUpsertInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export const ENV_SETTING_KEY_PREFIX = "env::";

export function resolveErrors(ctx: BaseContext): ErrorsLabels {
  return ctx.t().errorsTranslations;
}

export function canViewGeneralSettings(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.SETTINGS_VIEW) ||
    ctx.permissions.includes(AppPermission.SETTINGS_EDIT_GENERAL)
  );
}

export function assertCanViewGeneralSettings(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewGeneralSettings(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

export function isGeneralSettingKey(key: string): boolean {
  return !key.startsWith(ENV_SETTING_KEY_PREFIX);
}

export async function resolveGeneralSettingsAuthCtx(
  ctx: BaseContext
): Promise<{ actorUserId: string; tErrors: ErrorsLabels }> {
  const actorUserId = await requireAuth(ctx);
  return { actorUserId, tErrors: resolveErrors(ctx) };
}

export const SystemSettingRef = gqlSchemaBuilder.objectRef<SystemSettingSelectType>("SystemSetting");

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
      key: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
      value: t.string({ required: true, directives: { constraint: { maxLength: 2000 } } }),
      dataType: t.field({ type: SystemSettingDataTypePothos, required: false }),
      description: t.string({ required: false, directives: { constraint: { maxLength: 500 } } }),
      category: t.field({ type: SystemSettingCategoryPothos, required: false }),
    }),
  });
