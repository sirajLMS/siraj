import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  BulkCreateCarryoverInputPothos,
  BulkCreateCarryoverResultPothosObject,
  BulkDeleteResultPothosObject,
  BulkToExpenseInputPothos,
  BulkToExpenseResultPothosObject,
  CarryoverBalancePothosObject,
  CreateCarryoverInputPothos,
  DeleteResultPothosObject,
  UpdateCarryoverInputPothos,
} from "@/backend/graphql/pothos/teachers/carryover.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ValidationError } from "@/backend/lib";
import { CarryoverBalanceService } from "@/backend/services";

const MANAGE_SCOPE = { permission: AppPermission.ACCOUNTING_CARRYOVER_MANAGE } as const;

gqlSchemaBuilder.mutationField("bulkCreateCarryoverBalances", t =>
  t.field({
    type: BulkCreateCarryoverResultPothosObject,
    description:
      "Aggregate a selection of audited class instances into one carryover balance per teacher, link the sessions, and move them to awaiting settlement. The acting operator is resolved from the authenticated context and is never accepted as input.",
    authScopes: MANAGE_SCOPE,
    args: {
      input: t.arg({ type: BulkCreateCarryoverInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return CarryoverBalanceService.bulkCreateCarryoverBalances(
        { ...args.input, actorUserId },
        ctx.t().errorsTranslations
      );
    },
  })
);

gqlSchemaBuilder.mutationField("bulkCarryoverToExpense", t =>
  t.field({
    type: BulkToExpenseResultPothosObject,
    description:
      "Convert a selection of unpaid carryover balances into expense records, mark them paid, and settle the linked sessions. The acting operator is resolved from the authenticated context and is never accepted as input.",
    authScopes: MANAGE_SCOPE,
    args: {
      input: t.arg({ type: BulkToExpenseInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return CarryoverBalanceService.bulkCarryoverToExpense({ ...args.input, actorUserId }, ctx.t().errorsTranslations);
    },
  })
);

gqlSchemaBuilder.mutationField("createCarryoverBalance", t =>
  t.field({
    type: CarryoverBalancePothosObject,
    description:
      "Manually create a single carryover balance for a teacher. The acting operator is resolved from the authenticated context and is never accepted as input.",
    authScopes: MANAGE_SCOPE,
    args: {
      input: t.arg({ type: CreateCarryoverInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const { payable, teacherCurrency, ...rest } = args.input;
      // The schema requires both fields; the shared input-field helper widens
      // them to optional at the type level, so they are re-narrowed here.
      if (payable == null || teacherCurrency == null) {
        throw new ValidationError(tErrors.invalidInput);
      }
      return CarryoverBalanceService.createCarryoverBalance(
        { ...rest, payable, teacherCurrency, actorUserId },
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateCarryoverBalance", t =>
  t.field({
    type: CarryoverBalancePothosObject,
    description:
      "Apply a field-level patch to a carryover balance; only the provided fields change. The acting operator is resolved from the authenticated context and is never accepted as input.",
    authScopes: MANAGE_SCOPE,
    args: {
      input: t.arg({ type: UpdateCarryoverInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return CarryoverBalanceService.updateCarryoverBalance({ ...args.input, actorUserId }, ctx.t().errorsTranslations);
    },
  })
);

gqlSchemaBuilder.mutationField("deleteCarryoverBalance", t =>
  t.field({
    type: DeleteResultPothosObject,
    description:
      "Delete a single unpaid carryover balance; every linked session returns to its pre-carryover status. Paid carryovers cannot be deleted.",
    authScopes: MANAGE_SCOPE,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return CarryoverBalanceService.deleteCarryoverBalance({ id: args.id, actorUserId }, ctx.t().errorsTranslations);
    },
  })
);

gqlSchemaBuilder.mutationField("bulkDeleteCarryoverBalances", t =>
  t.field({
    type: BulkDeleteResultPothosObject,
    description:
      "Delete a batch of unpaid carryover balances in one transaction, unlinking their sessions back to their pre-carryover statuses.",
    authScopes: MANAGE_SCOPE,
    args: {
      ids: t.arg.idList({ required: true, directives: { constraint: { maxItems: 500 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return CarryoverBalanceService.bulkDeleteCarryoverBalances(
        { ids: args.ids, actorUserId },
        ctx.t().errorsTranslations
      );
    },
  })
);

gqlSchemaBuilder.mutationField("unpayCarryoverBalance", t =>
  t.field({
    type: CarryoverBalancePothosObject,
    description:
      "Revert a paid carryover balance: soft-delete the expense record, mark the carryover unpaid, and return the linked sessions to awaiting settlement.",
    authScopes: MANAGE_SCOPE,
    args: {
      id: t.arg.id({ required: true }),
      note: t.arg.string({ directives: { constraint: { maxLength: 2000 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return CarryoverBalanceService.unpayCarryoverBalance(
        { id: args.id, note: args.note, actorUserId },
        ctx.t().errorsTranslations
      );
    },
  })
);
