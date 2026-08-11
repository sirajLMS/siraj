import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { mapQuotaErrorToGraphQLError } from "@/backend/graphql/mutation/billing/quota.mutation";
import {
  CreditBalancePothosObject,
  CreditTransactionPothosObject,
} from "@/backend/graphql/pothos/billing/credit.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { CreditService } from "@/backend/services/billing/credit.service";

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
      const tErrors = ctx.t().errorsTranslations;
      try {
        return await CreditService.getStudentBalance(actorUserId, args.studentId, tErrors);
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
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
      const tErrors = ctx.t().errorsTranslations;
      const pagination = parsePaginationArgs(args.paginationArgs);

      try {
        const result = await CreditService.getStudentTransactions(actorUserId, args.studentId, pagination, tErrors);
        return result.rows;
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);
