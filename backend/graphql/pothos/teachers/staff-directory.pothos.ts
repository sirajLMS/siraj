import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  DisplayAmountPothosObject,
  resolveDisplayAmountFields,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { AccountStatusPothosObject, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ManagerDirectoryService } from "@/backend/services/staff/manager-directory.service";
import type {
  DisplayAmountReturnType,
  ManagerDirectoryMetrics,
  ManagerDirectoryResult,
  ManagerDirectoryRow,
  OnboardingMetricsResult,
  StaffDirectoryAutocompleteRow,
  TeacherDirectoryMetrics,
  TeacherDirectoryReturnType,
  TeacherDirectoryRow,
  UpdateManagerProfileInput,
} from "@/backend/types";
import { PaginationArgs } from "@/backend/types";

// ─── Object Types ─────────────────────────────────────────────────────────────

const TeacherDirectoryRowRef = gqlSchemaBuilder.objectRef<TeacherDirectoryRow>("TeacherDirectoryRow");

export const TeacherDirectoryRowPothosObject = TeacherDirectoryRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    index: t.string({
      resolve: (_parent, _args, _ctx, info) => {
        const idx = info.path.prev?.prev?.key;
        return typeof idx === "number" ? String(idx + 1) : "0";
      },
    }),
    userId: t.exposeString("userId"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    status: t.expose("status", { type: AccountStatusPothosObject }),
  }),
});

const TeacherDirectoryMetricsRef = gqlSchemaBuilder.objectRef<TeacherDirectoryMetrics>("TeacherDirectoryMetrics");

export const TeacherDirectoryMetricsPothosObject = TeacherDirectoryMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    activated: t.exposeInt("activated"),
    deactivated: t.exposeInt("deactivated"),
  }),
});

const TeacherDirectoryRef = gqlSchemaBuilder.objectRef<TeacherDirectoryReturnType>("TeacherDirectory");

export const TeacherDirectoryPothosObject = TeacherDirectoryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    metrics: t.expose("metrics", { type: TeacherDirectoryMetricsPothosObject }),
    rows: t.expose("rows", { type: [TeacherDirectoryRowPothosObject] }),
    totalTeachers: t.exposeInt("totalTeachers"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

// ─── Manager Directory Types & Queries ──────────────────────────────────────────

const ManagerDirectoryRowRef = gqlSchemaBuilder.objectRef<ManagerDirectoryRow>("ManagerDirectoryRow");

export const ManagerDirectoryRowPothosObject = ManagerDirectoryRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    staffProfileId: t.exposeString("staffProfileId"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    phone: t.exposeString("phone", { nullable: true }),
    status: t.expose("status", { type: AccountStatusPothosObject }),
    roleSlug: t.exposeString("roleSlug", { nullable: true }),
    roleName: t.exposeString("roleName", { nullable: true }),
    hourlyRate: t.exposeString("hourlyRate", {
      nullable: true,
      authScopes: { superAdmin: true },
      // Shared profile queries select these fields; non-admins get null instead of FORBIDDEN.
      unauthorizedResolver: () => null,
    }),
    rateCurrency: t.expose("rateCurrency", {
      type: CurrencyCodePothosObject,
      nullable: true,
      authScopes: { superAdmin: true },
      unauthorizedResolver: () => null,
    }),
    displayAmount: t.field({
      type: DisplayAmountPothosObject,
      nullable: true,
      resolve: parent => (parent as unknown as Record<string, unknown>).displayAmount as DisplayAmountReturnType | null,
    }),
  }),
});

const ManagerDirectoryMetricsRef = gqlSchemaBuilder.objectRef<ManagerDirectoryMetrics>("ManagerDirectoryMetrics");

export const ManagerDirectoryMetricsPothosObject = ManagerDirectoryMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    totalAdmin: t.exposeInt("totalAdmin"),
    systemStaff: t.exposeInt("systemStaff"),
    activeNow: t.exposeInt("activeNow"),
    alerts: t.exposeInt("alerts"),
  }),
});

const ManagerDirectoryResultRef = gqlSchemaBuilder.objectRef<ManagerDirectoryResult>("ManagerDirectoryResult");

export const ManagerDirectoryResultPothosObject = ManagerDirectoryResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    metrics: t.expose("metrics", { type: ManagerDirectoryMetricsPothosObject }),
    rows: t.expose("rows", { type: [ManagerDirectoryRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

// ─── Onboarding Metrics ──────────────────────────────────────────────────────────

const OnboardingMetricsRef = gqlSchemaBuilder.objectRef<OnboardingMetricsResult>("OnboardingMetrics");

export const OnboardingMetricsPothosObject = OnboardingMetricsRef.implement({
  description: "Summary metrics for the staff onboarding process",
  fields: t => ({
    id: t.exposeString("id"),
    activeStaff: t.exposeInt("activeStaff"),
    pendingApproval: t.exposeInt("pendingApproval"),
    avgOnboardingDays: t.exposeFloat("avgOnboardingDays"),
  }),
});

const StaffDirectoryAutocompleteRowRef = gqlSchemaBuilder.objectRef<StaffDirectoryAutocompleteRow>(
  "StaffDirectoryAutocompleteRow"
);

export const StaffDirectoryAutocompleteRowPothosObject = StaffDirectoryAutocompleteRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    email: t.exposeString("email"),
  }),
});

// ─── Queries ──────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("managerDirectory", t =>
  t.field({
    type: ManagerDirectoryResultPothosObject,
    authScopes: { loggedIn: true },
    args: {
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
      roleFilter: t.arg.string({ required: false }),
      statusFilter: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const locale = ctx.locale || "en";

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

      const filters = {
        roleFilter: args.roleFilter ?? null,
        statusFilter: args.statusFilter ?? null,
      };

      const result = await ManagerDirectoryService.getManagerDirectory(userId, pagination, locale, filters);

      const displayAmounts = await resolveDisplayAmountFields(
        result.rows as unknown as Record<string, unknown>[],
        ctx,
        "hourlyRate",
        "rateCurrency",
        "id"
      );

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

// ─── Mutations ────────────────────────────────────────────────────────────────

export const UpdateManagerProfileInputPothosObject = gqlSchemaBuilder
  .inputRef<UpdateManagerProfileInput>("UpdateManagerProfileInput")
  .implement({
    fields: t => ({
      phone: t.string({ required: false }),
      status: t.field({ type: AccountStatusPothosObject, required: false }),
      hourlyRate: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      rateCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
    }),
  });

import { ManagerProfileService } from "@/backend/services/staff/manager-profile.service";

gqlSchemaBuilder.mutationField("updateManagerProfile", t =>
  t.field({
    type: ManagerDirectoryRowPothosObject,
    authScopes: { superAdmin: true },
    args: {
      staffProfileId: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateManagerProfileInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const locale = ctx.locale || "en";

      return await ManagerProfileService.updateManagerProfile(actorUserId, args.staffProfileId, args.input, locale);
    },
    description: "Updates a manager's profile fields.",
  })
);
