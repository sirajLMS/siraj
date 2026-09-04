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
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
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
      limit: t.arg.int({
        required: false,
        defaultValue: 50,
        description: "Max rows per page (max 200)",
        directives: { constraint: { min: 1, max: 200 } },
      }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const filters: SessionAuditReportFilters = {
        teacherId: args.filter?.teacherId,
        studentId: args.filter?.studentId,
        dateFrom: args.filter?.dateFrom,
        dateTo: args.filter?.dateTo,
        currentStatuses: args.filter?.currentStatuses?.map(status => STATUS_FROM_POTHOS_ENUM[status]),
        search: args.filter?.search,
        includeDeleted: args.filter?.includeDeleted,
      };
      const sort: SessionAuditReportSort | null = args.sort
        ? {
            field: SORT_FIELD_FROM_POTHOS_ENUM[args.sort.field],
            direction: args.sort.direction === OrderSortDirection.ASC ? "asc" : "desc",
          }
        : null;
      return SessionAuditService.getReport(
        actorUserId,
        filters,
        sort,
        { limit: args.limit ?? 50, offset: args.offset ?? 0 },
        tErrors
      );
    },
  })
);
