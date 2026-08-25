import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { DisplayAmountPothosObject } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { AccountStatusPothosObject, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
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

// ─── Object Types ─────────────────────────────────────────────────────────────

export const TeacherDirectoryRowRef = gqlSchemaBuilder.objectRef<TeacherDirectoryRow>("TeacherDirectoryRow");

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

export const TeacherDirectoryMetricsRef =
  gqlSchemaBuilder.objectRef<TeacherDirectoryMetrics>("TeacherDirectoryMetrics");

export const TeacherDirectoryMetricsPothosObject = TeacherDirectoryMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    activated: t.exposeInt("activated"),
    deactivated: t.exposeInt("deactivated"),
  }),
});

export const TeacherDirectoryRef = gqlSchemaBuilder.objectRef<TeacherDirectoryReturnType>("TeacherDirectory");

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

export const ManagerDirectoryRowRef = gqlSchemaBuilder.objectRef<ManagerDirectoryRow>("ManagerDirectoryRow");

export const ManagerDirectoryRowPothosObject = ManagerDirectoryRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("id"),
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
      resolve: (parent: ManagerDirectoryRow & { displayAmount?: DisplayAmountReturnType | null }) =>
        parent.displayAmount ?? null,
    }),
  }),
});

export const ManagerDirectoryMetricsRef =
  gqlSchemaBuilder.objectRef<ManagerDirectoryMetrics>("ManagerDirectoryMetrics");

export const ManagerDirectoryMetricsPothosObject = ManagerDirectoryMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    totalAdmin: t.exposeInt("totalAdmin"),
    systemStaff: t.exposeInt("systemStaff"),
    activeNow: t.exposeInt("activeNow"),
    alerts: t.exposeInt("alerts"),
  }),
});

export const ManagerDirectoryResultRef = gqlSchemaBuilder.objectRef<ManagerDirectoryResult>("ManagerDirectoryResult");

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

export const OnboardingMetricsRef = gqlSchemaBuilder.objectRef<OnboardingMetricsResult>("OnboardingMetrics");

export const OnboardingMetricsPothosObject = OnboardingMetricsRef.implement({
  description: "Summary metrics for the staff onboarding process",
  fields: t => ({
    id: t.exposeString("id"),
    activeStaff: t.exposeInt("activeStaff"),
    pendingApproval: t.exposeInt("pendingApproval"),
    avgOnboardingDays: t.exposeFloat("avgOnboardingDays"),
  }),
});

export const StaffDirectoryAutocompleteRowRef = gqlSchemaBuilder.objectRef<StaffDirectoryAutocompleteRow>(
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

// ─── Mutations ────────────────────────────────────────────────────────────────

export const UpdateManagerProfileInputPothosObject = gqlSchemaBuilder
  .inputRef<UpdateManagerProfileInput>("UpdateManagerProfileInput")
  .implement({
    fields: t => ({
      name: t.string({ required: false, directives: { constraint: { maxLength: 512 } } }),
      email: t.string({ required: false, directives: { constraint: { maxLength: 254 } } }),
      phone: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
      status: t.field({ type: AccountStatusPothosObject, required: false }),
      hourlyRate: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      rateCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
    }),
  });
