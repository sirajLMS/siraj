import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject, TeacherDueStatusPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  TeacherDueReturnType,
  TeacherMonthlyReportReturnType,
  TeacherPendingDuesSummaryReturnType,
} from "@/backend/types";

const TeacherDueRef = gqlSchemaBuilder.objectRef<TeacherDueReturnType>("TeacherDue");

export const TeacherDuePothosObject = TeacherDueRef.implement({
  description: "A per-lesson earning accrued to a teacher when a lesson report is approved",
  fields: t => ({
    id: t.exposeString("id"),
    teacherId: t.exposeString("teacherId"),
    classInstanceId: t.exposeString("classInstanceId"),
    studentId: t.exposeString("studentId"),
    hours: t.exposeString("hours"),
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    status: t.expose("status", { type: TeacherDueStatusPothosEnum }),
    approvedByUserId: t.exposeString("approvedByUserId"),
    approvedAt: t.expose("approvedAt", { type: "DateTime" }),
    teacherPaymentId: t.exposeString("teacherPaymentId", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

const TeacherMonthlyReportRef = gqlSchemaBuilder.objectRef<TeacherMonthlyReportReturnType>("TeacherMonthlyReport");

export const TeacherMonthlyReportPothosObject = TeacherMonthlyReportRef.implement({
  description: "Monthly earnings summary for a teacher (lessons, counts, totals)",
  fields: t => ({
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    year: t.exposeInt("year"),
    month: t.exposeInt("month"),
    lessonsTaught: t.exposeInt("lessonsTaught"),
    approvedCount: t.exposeInt("approvedCount"),
    cancelledCount: t.exposeInt("cancelledCount"),
    totalAccruedHours: t.exposeFloat("totalAccruedHours"),
    totalDueAmount: t.exposeFloat("totalDueAmount"),
    totalPaidAmount: t.exposeFloat("totalPaidAmount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
  }),
});

const TeacherPendingDuesSummaryRef =
  gqlSchemaBuilder.objectRef<TeacherPendingDuesSummaryReturnType>("TeacherPendingDuesSummary");

export const TeacherPendingDuesSummaryPothosObject = TeacherPendingDuesSummaryRef.implement({
  description: "Summary of pending teacher dues (total count and amount)",
  fields: t => ({
    totalCount: t.exposeInt("totalCount"),
    totalAmount: t.exposeFloat("totalAmount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
  }),
});
