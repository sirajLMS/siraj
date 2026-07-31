import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  QuotaPothosObject,
  QuotaSubmitInputPothosRef,
  QuotaUpdateInputPothosRef,
} from "@/backend/graphql/pothos/billing/quota.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PermissionsService } from "@/backend/services";
import { QuotaService } from "@/backend/services/billing/quota.service";

gqlSchemaBuilder.mutationField("createQuota", t =>
  t.field({
    type: QuotaPothosObject,
    description: "Create a new quota allocation for a student",
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: QuotaSubmitInputPothosRef, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_MANAGE);
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      return QuotaService.createQuota(args.input, actorUserId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("updateQuota", t =>
  t.field({
    type: QuotaPothosObject,
    description: "Update an existing student quota allocation",
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: QuotaUpdateInputPothosRef, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_MANAGE);
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      return QuotaService.updateQuota(String(args.id), args.input, actorUserId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("deleteQuota", t =>
  t.field({
    type: QuotaPothosObject,
    description: "Soft delete a student quota allocation",
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_MANAGE);
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      return QuotaService.deleteQuota(String(args.id), actorUserId, ctx.locale);
    },
  })
);
