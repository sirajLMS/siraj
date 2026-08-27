import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AccountingPaymentBalancePothosObject,
  AccountingPaymentFilterInput,
  AccountingPaymentPothosObject,
  PackagePlanPothosObject,
} from "@/backend/graphql/pothos/billing/accounting.pothos";
import { mapQuotaErrorToGraphQLError } from "@/backend/graphql/mutation/billing/quota.mutation";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { AccountingPaymentService, PackagePlanService } from "@/backend/services";
import type { AccountingPaymentFilter } from "@/backend/types";

gqlSchemaBuilder.queryField("packagePlans", t =>
  t.field({
    type: [PackagePlanPothosObject],
    description: "List credit-hour package plans (active-only optional)",
    authScopes: { loggedIn: true },
    args: {
      activeOnly: t.arg.boolean({ required: false }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      await requireAuth(ctx);
      try {
        if (args.activeOnly) {
          return await PackagePlanService.listActive();
        }
        return await PackagePlanService.listPaginated(parsePaginationArgs(args.paginationArgs));
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.queryField("packagePlan", t =>
  t.field({
    type: PackagePlanPothosObject,
    description: "Get a single package plan by id",
    authScopes: { loggedIn: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx) => {
      await requireAuth(ctx);
      try {
        const plan = await PackagePlanService.getById(String(args.id));
        if (!plan) throw new Error("Package plan not found");
        return plan;
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.queryField("accountingPayments", t =>
  t.field({
    type: [AccountingPaymentPothosObject],
    description: "Paginated accounting payments with AND-combined filters",
    authScopes: { loggedIn: true },
    args: {
      filter: t.arg({ type: AccountingPaymentFilterInput, required: false }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      try {
        const result = await AccountingPaymentService.listPaginated(
          actorUserId,
          (args.filter ?? {}) as AccountingPaymentFilter,
          parsePaginationArgs(args.paginationArgs),
          tErrors
        );
        return result.rows;
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.queryField("accountingPayment", t =>
  t.field({
    type: AccountingPaymentPothosObject,
    description: "Get a single accounting payment by id",
    authScopes: { loggedIn: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      try {
        return await AccountingPaymentService.getById(actorUserId, String(args.id), tErrors);
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.queryField("studentCreditHourBalance", t =>
  t.field({
    type: AccountingPaymentBalancePothosObject,
    description: "Get the credit-hours balance for a student",
    authScopes: { loggedIn: true },
    args: { studentId: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      try {
        return await AccountingPaymentService.getStudentBalance(
          actorUserId,
          String(args.studentId),
          tErrors
        );
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);
