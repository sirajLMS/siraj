import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AvailableSlotPothosObject,
  QuotaBalancePothosObject,
  QuotaLedgerPaginatedResultPothosObject,
  QuotaPaginatedFilterPothosRef,
  QuotaPaginatedResultPothosObject,
  QuotaPothosObject,
} from "@/backend/graphql/pothos/billing/quota.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PermissionsService } from "@/backend/services";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { AvailabilityService } from "@/backend/services/scheduling/availability.service";
import { PaginationArgs } from "@/backend/types";

gqlSchemaBuilder.queryField("quotaLedger", t =>
  t.field({
    type: QuotaLedgerPaginatedResultPothosObject,
    description: "Get paginated audit ledger history for a quota",
    authScopes: { loggedIn: true },
    args: {
      quotaId: t.arg.id({ required: true }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_VIEW);
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
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
      const quotaId = String(args.quotaId);
      const rawRows = await QuotaLedgerRepository.findByQuotaId(undefined, quotaId, pagination);
      const totalCount = await QuotaLedgerRepository.countByQuotaId(undefined, quotaId);
      const rows = rawRows.map(r => ({
        ...r,
        reason: r.reason as import("@/backend/enum").QuotaLedgerReason,
      }));
      return { rows, totalCount };
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
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_VIEW);
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
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
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_VIEW);
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
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

gqlSchemaBuilder.queryField("studentQuotas", t =>
  t.field({
    type: [QuotaPothosObject],
    description: "List all quotas for a specific student",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_VIEW);
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      return QuotaService.listQuotas(
        { studentId: String(args.studentId) },
        null,
        undefined,
        actorUserId,
        ctx.locale
      ).then(r => r.rows);
    },
  })
);

gqlSchemaBuilder.queryField("studentOpenQuotas", t =>
  t.field({
    type: [QuotaPothosObject],
    description: "List open active quotas for a student in FIFO priority order",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_VIEW);
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      return QuotaService.listStudentOpenQuotas(String(args.studentId), undefined, actorUserId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("quotaBalance", t =>
  t.field({
    type: QuotaBalancePothosObject,
    description: "Get the aggregated quota balance summary and expiration breakdown for a student",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_VIEW);
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      return QuotaService.getStudentQuotaBalance(String(args.studentId), undefined, actorUserId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("availableClassSlots", t =>
  t.field({
    type: [AvailableSlotPothosObject],
    description: "Find available time slots between student and teacher for a given date range and duration",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
      teacherId: t.arg.id({ required: true }),
      startDate: t.arg({ type: "DateTime", required: true }),
      endDate: t.arg({ type: "DateTime", required: true }),
      durationMinutes: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_VIEW);
      if (!hasPermission) {
        throw new Error(ctx.t().errorsTranslations.insufficientPermissions);
      }
      return AvailabilityService.findAvailableSlots(
        String(args.studentId),
        String(args.teacherId),
        { from: args.startDate, to: args.endDate },
        args.durationMinutes,
        undefined,
        ctx.locale
      );
    },
  })
);
