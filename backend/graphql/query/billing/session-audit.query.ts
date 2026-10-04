import {
  AppPermission,
  OrderSortDirection,
  SessionAuditReportSortFieldEnum,
  SessionAuditStatusEnum,
} from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  SessionAuditReportFilterPothosInput,
  SessionAuditReportPagePothosObject,
  SessionAuditReportSortPothosInput,
} from "@/backend/graphql/pothos/accounting";
import { reportPageWindow, reportPaginationArgs, reportResolverContext } from "@/backend/graphql/query/__shared__";
import { SessionAuditService } from "@/backend/services";
import type { SessionAuditReportFilters, SessionAuditReportSort, SessionAuditStatus } from "@/backend/types";

/**
 * Request-side counterparts of the report domain types: the GraphQL layer
 * receives the registered enum members, while the service contract speaks the
 * canonical string unions, so the wiring maps values in both directions with
 * exhaustive lookups instead of casts.
 */
const STATUS_FROM_POTHOS_ENUM: Record<SessionAuditStatusEnum, SessionAuditStatus> = {
  [SessionAuditStatusEnum.open]: "open",
  [SessionAuditStatusEnum.end]: "end",
  [SessionAuditStatusEnum.Absent]: "Absent",
  [SessionAuditStatusEnum.absent_student]: "absent_student",
};

const SORT_DIRECTION_FROM_POTHOS_ENUM: Record<OrderSortDirection, SessionAuditReportSort["direction"]> = {
  [OrderSortDirection.ASC]: "asc",
  [OrderSortDirection.DESC]: "desc",
};

const SORT_FIELD_FROM_POTHOS_ENUM: Record<SessionAuditReportSortFieldEnum, SessionAuditReportSort["field"]> = {
  [SessionAuditReportSortFieldEnum.scheduledStartAt]: "scheduledStartAt",
  [SessionAuditReportSortFieldEnum.scheduledEndAt]: "scheduledEndAt",
  [SessionAuditReportSortFieldEnum.actualStartAt]: "actualStartAt",
  [SessionAuditReportSortFieldEnum.actualEndAt]: "actualEndAt",
  [SessionAuditReportSortFieldEnum.durationMinutes]: "durationMinutes",
  [SessionAuditReportSortFieldEnum.calculatedDuration]: "calculatedDuration",
  [SessionAuditReportSortFieldEnum.teacherPaidAmount]: "teacherPaidAmount",
  [SessionAuditReportSortFieldEnum.calculationStatus]: "calculationStatus",
  [SessionAuditReportSortFieldEnum.teacherName]: "teacherName",
  [SessionAuditReportSortFieldEnum.studentName]: "studentName",
};

gqlSchemaBuilder.queryField("sessionAuditReport", t =>
  t.field({
    type: SessionAuditReportPagePothosObject,
    description: "Paginated session audit report across class instances. Aggregates cover the returned page.",
    authScopes: { permission: AppPermission.ACCOUNTING_REPORTS_VIEW },
    args: {
      filter: t.arg({ type: SessionAuditReportFilterPothosInput, required: false }),
      sort: t.arg({ type: SessionAuditReportSortPothosInput, required: false }),
      ...reportPaginationArgs(t),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await reportResolverContext(ctx);
      // includeDeleted holds for manage-capable callers only; a view-only
      // caller requesting it gets the flag silently removed, mirroring the
      // CSV export route — soft-deleted rows must not surface through the
      // query for callers the route would strip them from.
      const requestedIncludeDeleted = args.filter?.includeDeleted === true;
      const includeDeleted = requestedIncludeDeleted
        ? ctx.isSuperAdmin || ctx.permissions.includes(AppPermission.ACCOUNTING_REPORTS_MANAGE)
        : args.filter?.includeDeleted;
      const filters: SessionAuditReportFilters = {
        teacherId: args.filter?.teacherId,
        studentId: args.filter?.studentId,
        dateFrom: args.filter?.dateFrom,
        dateTo: args.filter?.dateTo,
        currentStatuses: args.filter?.currentStatuses?.map(status => STATUS_FROM_POTHOS_ENUM[status]),
        search: args.filter?.search,
        includeDeleted,
      };
      const sort: SessionAuditReportSort | null = args.sort
        ? {
            field: SORT_FIELD_FROM_POTHOS_ENUM[args.sort.field],
            direction: SORT_DIRECTION_FROM_POTHOS_ENUM[args.sort.direction],
          }
        : null;
      return SessionAuditService.getReport(actorUserId, filters, sort, reportPageWindow(args), tErrors);
    },
  })
);
