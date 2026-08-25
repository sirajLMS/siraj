import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { TeacherPendingDuesSummaryPothosObject } from "@/backend/graphql/pothos/teachers/teacher-due.pothos";
import type { SupervisorDashboardReturnType, SupervisorMonthlySnapshotReturnType } from "@/backend/types";

export const SupervisorMonthlySnapshotRef =
  gqlSchemaBuilder.objectRef<SupervisorMonthlySnapshotReturnType>("SupervisorMonthlySnapshot");

export const SupervisorMonthlySnapshotPothosObject = SupervisorMonthlySnapshotRef.implement({
  description: "Current calendar month snapshot for the supervisor dashboard",
  fields: t => ({
    year: t.exposeInt("year"),
    month: t.exposeInt("month"),
    label: t.exposeString("label"),
  }),
});

export const SupervisorDashboardRef = gqlSchemaBuilder.objectRef<SupervisorDashboardReturnType>("SupervisorDashboard");

export const SupervisorDashboardPothosObject = SupervisorDashboardRef.implement({
  description: "Aggregated supervisor portal dashboard data",
  fields: t => ({
    supervisorName: t.exposeString("supervisorName"),
    pendingReviewCount: t.exposeInt("pendingReviewCount"),
    pendingDuesSummary: t.expose("pendingDuesSummary", {
      type: TeacherPendingDuesSummaryPothosObject,
    }),
    monthlySnapshot: t.expose("monthlySnapshot", {
      type: SupervisorMonthlySnapshotPothosObject,
    }),
  }),
});
