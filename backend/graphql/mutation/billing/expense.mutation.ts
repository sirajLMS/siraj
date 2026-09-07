import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  BulkDeleteExpensesInputPothos,
  CreateExpenseInputPothos,
  DeleteExpenseInputPothos,
  ExpenseBulkDeleteResultPothosObject,
  ExpenseDeleteResultPothosObject,
  ExpensePothosObject,
  UpdateExpenseInputPothos,
} from "@/backend/graphql/pothos/expenses";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ValidationError } from "@/backend/lib";
import { ExpenseService } from "@/backend/services";

const MANAGE_SCOPE = { permission: AppPermission.ACCOUNTING_EXPENSES_MANAGE } as const;

gqlSchemaBuilder.mutationField("createExpense", t =>
  t.field({
    type: ExpensePothosObject,
    description:
      "Manually create a single expense ledger entry. Salaries-type expenses are rejected here; they are written only by the carryover settlement flow. A client-supplied clientRequestId makes retried submissions idempotent. The acting operator is resolved from the authenticated context and is never accepted as input.",
    authScopes: MANAGE_SCOPE,
    args: {
      input: t.arg({ type: CreateExpenseInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ExpenseService.create(
        { ...args.input, createdByUserId: actorUserId },
        actorUserId,
        ctx.t().errorsTranslations
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateExpense", t =>
  t.field({
    type: ExpensePothosObject,
    description:
      "Apply a field-level patch to an expense; only the provided fields change. The acting operator is resolved from the authenticated context and is never accepted as input.",
    authScopes: MANAGE_SCOPE,
    args: {
      input: t.arg({ type: UpdateExpenseInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ExpenseService.update({ ...args.input, actorUserId }, ctx.t().errorsTranslations);
    },
  })
);

gqlSchemaBuilder.mutationField("deleteExpense", t =>
  t.field({
    type: ExpenseDeleteResultPothosObject,
    description:
      "Soft-delete a single expense with an optional operator reason. Re-deleting an already deleted expense is an idempotent no-op. Expenses produced by a paid carryover settlement can only be removed through the unpay flow.",
    authScopes: MANAGE_SCOPE,
    args: {
      input: t.arg({ type: DeleteExpenseInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const row = await ExpenseService.softDelete(
        { id: args.input.id, actorUserId, reason: args.input.reason },
        ctx.t().errorsTranslations
      );
      return { id: row.id, deleted: true };
    },
  })
);

gqlSchemaBuilder.mutationField("bulkDeleteExpenses", t =>
  t.field({
    type: ExpenseBulkDeleteResultPothosObject,
    description:
      "Atomically soft-delete a batch of expenses in one transaction with an optional operator reason; any rejection rolls the whole batch back. The id list is capped at 500 entries by the @constraint directive.",
    authScopes: MANAGE_SCOPE,
    args: {
      input: t.arg({ type: BulkDeleteExpensesInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      if (args.input.ids.length === 0) {
        throw new ValidationError(tErrors.invalidInput);
      }
      return ExpenseService.bulkDelete({ ids: args.input.ids, actorUserId, reason: args.input.reason }, tErrors);
    },
  })
);
