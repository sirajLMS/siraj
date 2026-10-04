import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CarryoverBalancePothosObject,
  CarryoverFilterPothosInput,
  CarryoverLinkedSessionPothosObject,
  CarryoverPagePothosObject,
} from "@/backend/graphql/pothos/teachers/carryover.pothos";
import { reportPageWindow, reportPaginationArgs, reportResolverContext } from "@/backend/graphql/query/__shared__";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ValidationError } from "@/backend/lib";
import { CarryoverBalanceService } from "@/backend/services";
import type { CarryoverFilters, CarryoverPaidStatusFilter } from "@/backend/types";
import { CARRYOVER_PAID_STATUS_VALUES } from "@/shared/constants/billing/carryover.enum";
import type { ErrorsLabels } from "@/shared/locale";

const PAID_STATUS_VALUES: ReadonlySet<string> = new Set<string>(CARRYOVER_PAID_STATUS_VALUES);

/** Canonical hyphenated uuid shape; anything else cannot name a row in a uuid column. */
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isCarryoverPaidStatus(value: string): value is CarryoverPaidStatusFilter {
  return PAID_STATUS_VALUES.has(value);
}

/**
 * Narrows the free-form `paidStatus` filter string to the closed set the
 * service accepts: absent/blank means "no filter", an unknown value is a
 * malformed request.
 */
function narrowPaidStatus(
  paidStatus: string | null | undefined,
  tErrors: ErrorsLabels
): CarryoverPaidStatusFilter | null {
  const value = paidStatus?.trim() ?? null;
  if (value === null || value === "") {
    return null;
  }
  if (!isCarryoverPaidStatus(value)) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value;
}

/**
 * Narrows the free-form `teacherId` filter: absent/blank means "no filter", a
 * malformed value is a 400-class client error instead of a uuid-cast database
 * error at the repository.
 */
function narrowTeacherId(teacherId: string | null | undefined, tErrors: ErrorsLabels): string | null {
  const value = teacherId?.trim() ?? null;
  if (value === null || value === "") {
    return null;
  }
  if (!UUID_SHAPE.test(value)) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value;
}

gqlSchemaBuilder.queryField("carryoverBalances", t =>
  t.field({
    type: CarryoverPagePothosObject,
    description:
      "Paginated carryover balance list; aggregates cover the full filtered set, not just the returned page.",
    authScopes: { permission: AppPermission.ACCOUNTING_CARRYOVER_VIEW },
    args: {
      filter: t.arg({ type: CarryoverFilterPothosInput, required: false }),
      ...reportPaginationArgs(t),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await reportResolverContext(ctx);
      const filter = args.filter;
      const filters: CarryoverFilters = {
        teacherId: narrowTeacherId(filter?.teacherId, tErrors),
        paidStatus: narrowPaidStatus(filter?.paidStatus, tErrors),
        dateFrom: filter?.dateFrom ?? null,
        dateTo: filter?.dateTo ?? null,
        includeDisabledTeachers: filter?.includeDisabledTeachers ?? null,
        search: filter?.search ?? null,
      };
      return CarryoverBalanceService.getReport(actorUserId, filters, reportPageWindow(args), tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("carryoverBalance", t =>
  t.field({
    type: CarryoverBalancePothosObject,
    description: "Single carryover balance by id, for the drill-down view.",
    authScopes: { permission: AppPermission.ACCOUNTING_CARRYOVER_VIEW },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return CarryoverBalanceService.getById(actorUserId, args.id, ctx.t().errorsTranslations);
    },
  })
);

gqlSchemaBuilder.queryField("carryoverBalanceLinkedSessions", t =>
  t.field({
    type: [CarryoverLinkedSessionPothosObject],
    description: "Sessions aggregated into one carryover balance, for the detail drawer's linked sessions list.",
    authScopes: { permission: AppPermission.ACCOUNTING_CARRYOVER_VIEW },
    args: {
      carryoverId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return CarryoverBalanceService.getLinkedSessions(actorUserId, args.carryoverId, ctx.t().errorsTranslations);
    },
  })
);
