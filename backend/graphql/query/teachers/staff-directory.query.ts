import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import {
  ManagerDirectoryResultPothosObject,
  OnboardingMetricsPothosObject,
  StaffDirectoryAutocompleteRowPothosObject,
} from "@/backend/graphql/pothos/teachers/staff-directory.pothos";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ManagerDirectoryService, resolveDisplayAmountFields } from "@/backend/services";
import type { DisplayAmountReturnType } from "@/backend/types";

const STAFF_DIRECTORY_DEFAULT_LIMIT = 20;
const STAFF_DIRECTORY_MAX_LIMIT = 100;

gqlSchemaBuilder.queryField("staffDirectory", t =>
  t.field({
    type: [StaffDirectoryAutocompleteRowPothosObject],
    nullable: false,
    authScopes: { permission: AppPermission.STAFF_VIEW_DIRECTORY },
    args: {
      search: t.arg.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      limit: t.arg.int({
        required: false,
        directives: { constraint: { min: 1, max: STAFF_DIRECTORY_MAX_LIMIT } },
      }),
      permissionGroupFilter: t.arg.string({ required: false, directives: { constraint: { maxLength: 256 } } }),
    },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const limit = Math.min(args.limit ?? STAFF_DIRECTORY_DEFAULT_LIMIT, STAFF_DIRECTORY_MAX_LIMIT);
      const search = args.search?.trim() ?? null;
      const permissionGroupFilter = args.permissionGroupFilter ?? null;

      return ManagerDirectoryService.getStaffDirectory(userId, search, limit, permissionGroupFilter, ctx.locale);
    },
    description: "Lightweight staff list for autocomplete (id, name, avatarUrl, email).",
  })
);

gqlSchemaBuilder.queryField("managerDirectory", t =>
  t.field({
    type: ManagerDirectoryResultPothosObject,
    authScopes: { loggedIn: true },
    args: {
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
      roleFilter: t.arg.string({ required: false, directives: { constraint: { maxLength: 64 } } }),
      statusFilter: t.arg.string({ required: false, directives: { constraint: { maxLength: 64 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const locale = ctx.locale || "en";

      const pagination = parsePaginationArgs(args.paginationArgs);

      const filters = {
        roleFilter: args.roleFilter ?? null,
        statusFilter: args.statusFilter ?? null,
      };

      const result = await ManagerDirectoryService.getManagerDirectory(userId, pagination, locale, filters);

      const rowsForDisplay = result.rows.map(row => ({
        ...row,
        displayAmount: null as DisplayAmountReturnType | null,
      })) as Array<{ id: string; [key: string]: unknown }>;
      const displayAmounts = await resolveDisplayAmountFields(rowsForDisplay, ctx, "hourlyRate", "rateCurrency", "id");

      return {
        id: "manager-directory",
        metrics: result.metrics,
        rows: result.rows.map(row => ({
          ...row,
          displayAmount: displayAmounts.get(row.id) ?? null,
        })),
        totalCount: result.totalCount,
        pageInfo: result.pageInfo,
      };
    },
    description: "Lists all staff members with administrative access.",
  })
);

gqlSchemaBuilder.queryField("onboardingMetrics", t =>
  t.field({
    type: OnboardingMetricsPothosObject,
    authScopes: { superAdmin: true },
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const locale = ctx.locale || "en";

      return await ManagerDirectoryService.getOnboardingMetrics(userId, locale);
    },
    description: "Returns onboarding metrics for staff accounts.",
  })
);
