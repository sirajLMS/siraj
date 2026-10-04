import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ExpenseFilterPothosInput,
  ExpensePagePothosObject,
  ExpensePothosObject,
} from "@/backend/graphql/pothos/expenses";
import { reportPageWindow, reportPaginationArgs, reportResolverContext } from "@/backend/graphql/query/__shared__";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ExpenseService } from "@/backend/services";
import type { ExpenseFilters } from "@/backend/types";

gqlSchemaBuilder.queryField("expenses", t =>
  t.field({
    type: ExpensePagePothosObject,
    description:
      "Paginated, filtered expense ledger. Aggregates describe the returned page; totalCount covers the whole filtered set for pagination controls.",
    authScopes: { permission: AppPermission.ACCOUNTING_EXPENSES_VIEW },
    args: {
      filter: t.arg({ type: ExpenseFilterPothosInput, required: false }),
      ...reportPaginationArgs(t),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await reportResolverContext(ctx);
      const filter = args.filter;
      const canManage = ctx.isSuperAdmin || ctx.permissions.includes(AppPermission.ACCOUNTING_EXPENSES_MANAGE);
      // includeDeleted holds for manage-capable callers only; a view-only
      // caller requesting it gets the flag silently removed, mirroring the
      // CSV export route — soft-deleted rows must not surface through the
      // query for callers the route would strip them from.
      const includeDeleted = filter?.includeDeleted === true ? canManage : (filter?.includeDeleted ?? null);
      const filters: ExpenseFilters = {
        title: filter?.title ?? null,
        types: filter?.types ?? null,
        expenseDate: filter?.expenseDate ?? null,
        paymentDateFrom: filter?.paymentDateFrom ?? null,
        paymentDateTo: filter?.paymentDateTo ?? null,
        includeDeleted,
      };
      return ExpenseService.getReport(actorUserId, filters, reportPageWindow(args), tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("expense", t =>
  t.field({
    type: ExpensePothosObject,
    description: "Single expense by id, for the drill-down view.",
    authScopes: { permission: AppPermission.ACCOUNTING_EXPENSES_VIEW },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ExpenseService.getById(actorUserId, args.id, ctx.t().errorsTranslations);
    },
  })
);
