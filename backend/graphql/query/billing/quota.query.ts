import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  QuotaLedgerPaginatedResultPothosObject,
  QuotaPaginatedFilterPothosRef,
  QuotaPaginatedResultPothosObject,
  QuotaPothosObject,
} from "@/backend/graphql/pothos/billing/quota.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { PaginationArgs } from "@/backend/types";

gqlSchemaBuilder.queryField("quotaLedger", t =>
  t.field({
    type: QuotaLedgerPaginatedResultPothosObject,
    description: "Get paginated audit ledger history for a quota",
    // NOTE: Runs two sequential queries — could be optimized to a single paginated count query
    authScopes: { loggedIn: true },
    args: {
      quotaId: t.arg.id({ required: true }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      let pagination: PaginationArgs | null = null;
      if (args.pagination) {
        pagination = new PaginationArgs({
          first: args.pagination.first ?? null,
          skip: args.pagination.skip ?? null,
          after: args.pagination.after ?? null,
          before: args.pagination.before ?? null,
          last: args.pagination.last ?? null,
          page: args.pagination.page ?? null,
          maxCount: args.pagination.maxCount ?? null,
        });
      }
      return QuotaService.getQuotaLedger(String(args.quotaId), pagination, actorUserId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("quota", t =>
  t.field({
    type: QuotaPothosObject,
    description: "Get a specific quota by ID",
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return QuotaService.getQuota(String(args.id), ctx.locale, undefined, actorUserId);
    },
  })
);

gqlSchemaBuilder.queryField("quotas", t =>
  t.field({
    type: QuotaPaginatedResultPothosObject,
    description: "List quotas with optional filters and pagination",
    authScopes: { loggedIn: true },
    args: {
      filter: t.arg({ type: QuotaPaginatedFilterPothosRef, required: false }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      let pagination: PaginationArgs | null = null;
      if (args.pagination) {
        pagination = new PaginationArgs({
          first: args.pagination.first ?? null,
          skip: args.pagination.skip ?? null,
          after: args.pagination.after ?? null,
          before: args.pagination.before ?? null,
          last: args.pagination.last ?? null,
          page: args.pagination.page ?? null,
          maxCount: args.pagination.maxCount ?? null,
        });
      }
      return QuotaService.listQuotas(args.filter ?? null, pagination, undefined, actorUserId, ctx.locale);
    },
  })
);
