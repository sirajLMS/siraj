import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AvailableClassSlotPothosObject,
  QuotaLedgerPaginatedResultPothosObject,
  QuotaPaginatedFilterPothosRef,
  QuotaPaginatedResultPothosObject,
  QuotaPothosObject,
} from "@/backend/graphql/pothos/billing/quota.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { AvailabilityService } from "@/backend/services/scheduling/availability.service";
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
      const pagination = PaginationArgs.fromArgs(args.pagination);
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
      const pagination = PaginationArgs.fromArgs(args.pagination);
      return QuotaService.listQuotas(args.filter ?? null, pagination, undefined, actorUserId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("studentQuotas", t =>
  t.field({
    type: [QuotaPothosObject],
    description: "List all quotas for a student",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return QuotaService.listStudentQuotas(String(args.studentId), undefined, actorUserId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("studentOpenQuotas", t =>
  t.field({
    type: [QuotaPothosObject],
    description: "List only active/open quotas (status ACTIVE, remaining > 0) for a student",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return QuotaService.listStudentOpenQuotas(String(args.studentId), undefined, actorUserId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("availableClassSlots", t =>
  t.field({
    type: [AvailableClassSlotPothosObject],
    description: "Find available class slots for a student on a given date",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
      date: t.arg({ type: "DateTime", required: true }),
      teacherId: t.arg.id({ required: false }),
      durationMinutes: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      await requireAuth(ctx);
      return AvailabilityService.findAvailableSlots(
        String(args.studentId),
        args.date,
        args.teacherId ? String(args.teacherId) : null,
        args.durationMinutes ?? 60,
        undefined,
        ctx.locale
      );
    },
  })
);
