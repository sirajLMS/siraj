import { AppPermission } from "@/backend/enum";
import { mapQuotaErrorToGraphQLError } from "@/backend/graphql/mutation/billing/quota.mutation";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AccountingPaymentPothosObject,
  AccountingPaymentInput,
  AccountingPaymentTogglePaidInputObject,
  AccountingPaymentUpdateInputObject,
  PackagePlanInput,
  PackagePlanPothosObject,
  PackagePlanUpdateInputType,
} from "@/backend/graphql/pothos/billing/accounting.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { AccountingPaymentService, PackagePlanService, PermissionsService } from "@/backend/services";
import type {
  AccountingPaymentSubmitInput,
  AccountingPaymentTogglePaidInput,
  AccountingPaymentUpdateInput,
  PackagePlanSubmitInput,
  PackagePlanUpdateInput,
} from "@/backend/types";

gqlSchemaBuilder.mutationField("createPackagePlan", t =>
  t.field({
    type: PackagePlanPothosObject,
    description: "Create a credit-hour package plan",
    authScopes: { loggedIn: true },
    args: { input: t.arg({ type: PackagePlanInput, required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.ACCOUNTING_PAYMENTS_MANAGE
      );
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      const tErrors = ctx.t().errorsTranslations;
      try {
        return await PackagePlanService.create(
          actorUserId,
          args.input as PackagePlanSubmitInput,
          tErrors
        );
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.mutationField("updatePackagePlan", t =>
  t.field({
    type: PackagePlanPothosObject,
    description: "Update a credit-hour package plan (snapshot-invariant)",
    authScopes: { loggedIn: true },
    args: { input: t.arg({ type: PackagePlanUpdateInputType, required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.ACCOUNTING_PAYMENTS_MANAGE
      );
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      const tErrors = ctx.t().errorsTranslations;
      try {
        return await PackagePlanService.update(
          actorUserId,
          args.input as unknown as PackagePlanUpdateInput,
          tErrors
        );
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.mutationField("archivePackagePlan", t =>
  t.field({
    type: PackagePlanPothosObject,
    description: "Soft-archive a package plan (hidden from catalogs, history intact)",
    authScopes: { loggedIn: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.ACCOUNTING_PAYMENTS_MANAGE
      );
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      const tErrors = ctx.t().errorsTranslations;
      try {
        await PackagePlanService.archive(actorUserId, String(args.id), tErrors);
        const plan = await PackagePlanService.getById(String(args.id));
        if (!plan) throw new Error("Package plan not found after archive");
        return plan;
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.mutationField("recordAccountingPayment", t =>
  t.field({
    type: AccountingPaymentPothosObject,
    description: "Record an accounting payment that credits hours to a student",
    authScopes: { loggedIn: true },
    args: { input: t.arg({ type: AccountingPaymentInput, required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.ACCOUNTING_PAYMENTS_MANAGE
      );
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      const tErrors = ctx.t().errorsTranslations;
      try {
        return await AccountingPaymentService.recordPayment(
          actorUserId,
          { ...args.input, paymentDate: new Date(args.input.paymentDate) } as AccountingPaymentSubmitInput,
          tErrors
        );
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.mutationField("updateAccountingPayment", t =>
  t.field({
    type: AccountingPaymentPothosObject,
    description: "Edit an accounting payment (gateway/note-only or creditHours delta)",
    authScopes: { loggedIn: true },
    args: { input: t.arg({ type: AccountingPaymentUpdateInputObject, required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.ACCOUNTING_PAYMENTS_MANAGE
      );
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      const tErrors = ctx.t().errorsTranslations;
      try {
        return await AccountingPaymentService.update(
          actorUserId,
          args.input as AccountingPaymentUpdateInput,
          tErrors
        );
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.mutationField("toggleAccountingPaymentPaidStatus", t =>
  t.field({
    type: AccountingPaymentPothosObject,
    description: "Toggle the Paid status on an accounting payment (cascades to invoice)",
    authScopes: { loggedIn: true },
    args: { input: t.arg({ type: AccountingPaymentTogglePaidInputObject, required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.ACCOUNTING_PAYMENTS_MANAGE
      );
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      const tErrors = ctx.t().errorsTranslations;
      try {
        return await AccountingPaymentService.togglePaidStatus(
          actorUserId,
          args.input as AccountingPaymentTogglePaidInput,
          tErrors
        );
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);
