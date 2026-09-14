// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AdminBillingSummaryPothosObject,
  AdminInvoiceHistoryResultPothosObject,
  enrichSummaryWithDisplayAmounts,
  ParentBillingSummaryPothosObject,
  ParentInvoiceHistoryResultPothosObject,
  prepareParentScopedResolver,
  StudentCreditRowPothosObject,
} from "@/backend/graphql/pothos/billing/billing-history.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  BillingHistoryService,
  populateBillingFxDisplayCurrencyByUserId,
  resolveDisplayAmountFields,
} from "@/backend/services";

gqlSchemaBuilder.queryField("parentInvoiceHistory", t =>
  t.field({
    type: ParentInvoiceHistoryResultPothosObject,
    authScopes: { loggedIn: true },
    args: {
      parentId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
      userId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
      search: t.arg.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const { callerUserId, tErrors } = await prepareParentScopedResolver(ctx, args);
      const pagination = parsePaginationArgs(args.paginationArgs);

      const result = await BillingHistoryService.getParentInvoiceHistory(
        callerUserId,
        args.parentId ?? null,
        args.userId ?? null,
        tErrors,
        pagination,
        args.search ?? null
      );

      const displayAmounts = await resolveDisplayAmountFields(result.rows, ctx, "amount", "currency", "parentUserId");
      return {
        ...result,
        rows: result.rows.map(row => Object.assign(row, { displayAmount: displayAmounts.get(row.id) ?? null })),
      };
    },
  })
);

gqlSchemaBuilder.queryField("adminInvoices", t =>
  t.field({
    type: AdminInvoiceHistoryResultPothosObject,
    authScopes: { permission: AppPermission.BILLING_VIEW_HISTORY },
    args: {
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
      search: t.arg.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const pagination = parsePaginationArgs(args.paginationArgs);

      const tErrors = ctx.t().errorsTranslations;
      const result = await BillingHistoryService.getAdminInvoices(userId, tErrors, pagination, args.search ?? null);
      await populateBillingFxDisplayCurrencyByUserId(
        ctx,
        result.rows.map(row => row.parentUserId)
      );

      const displayAmounts = await resolveDisplayAmountFields(result.rows, ctx, "amount", "currency", "parentUserId");
      return {
        ...result,
        rows: result.rows.map(row => Object.assign(row, { displayAmount: displayAmounts.get(row.id) ?? null })),
      };
    },
  })
);

gqlSchemaBuilder.queryField("adminBillingSummary", t =>
  t.field({
    type: AdminBillingSummaryPothosObject,
    authScopes: { permission: AppPermission.BILLING_VIEW_HISTORY },
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const result = await BillingHistoryService.getAdminBillingSummary(userId, tErrors);

      return enrichSummaryWithDisplayAmounts(result, ctx, "outstandingByCurrency", "mtdRevenueByCurrency");
    },
  })
);

gqlSchemaBuilder.queryField("studentCreditStatus", t =>
  t.field({
    type: [StudentCreditRowPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return BillingHistoryService.getStudentCreditStatus(userId, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("parentBillingSummary", t =>
  t.field({
    type: ParentBillingSummaryPothosObject,
    authScopes: { loggedIn: true },
    args: {
      parentId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
      userId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const { callerUserId, tErrors } = await prepareParentScopedResolver(ctx, args);

      const result = await BillingHistoryService.getParentBillingSummary(
        callerUserId,
        args.parentId ?? null,
        args.userId ?? null,
        tErrors
      );

      return enrichSummaryWithDisplayAmounts(result, ctx, "outstandingByCurrency", "paidThisTermByCurrency");
    },
  })
);
