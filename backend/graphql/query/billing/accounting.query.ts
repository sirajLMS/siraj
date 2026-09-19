import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { mapQuotaErrorToGraphQLError } from "@/backend/graphql/mutation/billing/quota.mutation";
import {
  AccountingPaymentBalancePothosObject,
  AccountingPaymentFilterInput,
  AccountingPaymentPothosObject,
  PackagePlanPothosObject,
} from "@/backend/graphql/pothos/billing/accounting.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { NotFoundError } from "@/backend/lib/errors";
import { AccountingPaymentService, PackagePlanService } from "@/backend/services";
import type { AccountingPaymentFilter } from "@/backend/types";

/** Local shape mirroring the Pothos filter object (nullable optionals). */
type AccountingFilterShape = {
  readonly studentId?: string | null;
  readonly parentId?: string | null;
  readonly fromDate?: string | null;
  readonly toDate?: string | null;
  readonly unpaidOnly?: boolean | null;
};

/** Maps the Pothos filter object onto the canonical service filter. */
function normalizeAccountingFilter(filter?: AccountingFilterShape | null): AccountingPaymentFilter | null {
  if (filter == null) return null;
  const mapped: AccountingPaymentFilter = {};
  if (filter.studentId != null) mapped.studentId = filter.studentId;
  if (filter.parentId != null) mapped.parentId = filter.parentId;
  if (filter.fromDate != null) mapped.fromDate = filter.fromDate;
  if (filter.toDate != null) mapped.toDate = filter.toDate;
  if (filter.unpaidOnly != null) mapped.unpaidOnly = filter.unpaidOnly;
  return Object.keys(mapped).length > 0 ? mapped : null;
}

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
      const tErrors = ctx.t().errorsTranslations;
      await requireAuth(ctx);
      try {
        const plan = await PackagePlanService.getById(args.id);
        if (!plan) throw new NotFoundError("PACKAGE_PLAN", tErrors.notFound);
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
          normalizeAccountingFilter(args.filter) ?? {},
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
        return await AccountingPaymentService.getById(actorUserId, args.id, tErrors);
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
        return await AccountingPaymentService.getStudentBalance(actorUserId, args.studentId, tErrors);
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);
