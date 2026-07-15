import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CreditBalancePothosObject,
  CreditTransactionPothosObject,
} from "@/backend/graphql/pothos/billing/credit.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { CreditService } from "@/backend/services/billing/credit.service";
import { PaginationArgs } from "@/backend/types";

gqlSchemaBuilder.queryField("studentCreditBalance", t =>
  t.field({
    type: CreditBalancePothosObject,
    description: "Get the credit balance (classes total and remaining) for a student",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = await ctx.t("errors");
      return CreditService.getStudentBalance(actorUserId, args.studentId, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("studentCreditTransactions", t =>
  t.field({
    type: [CreditTransactionPothosObject],
    description: "Get the credit transaction history for a student with optional pagination",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = await ctx.t("errors");
      let pagination: PaginationArgs | null = null;
      if (args.paginationArgs) {
        pagination = new PaginationArgs({
          first: args.paginationArgs.first ?? null,
          skip: args.paginationArgs.skip ?? null,
          after: args.paginationArgs.after ?? null,
          before: args.paginationArgs.before ?? null,
          last: args.paginationArgs.last ?? null,
          page: args.paginationArgs.page ?? null,
          maxCount: args.paginationArgs.maxCount ?? null,
        });
      }

      const result = await CreditService.getStudentTransactions(actorUserId, args.studentId, pagination, tErrors);
      return result.rows;
    },
  })
);
