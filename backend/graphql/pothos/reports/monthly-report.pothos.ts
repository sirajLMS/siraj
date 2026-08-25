import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { StudentMonthlyReportReturnType } from "@/backend/types";

export const StudentMonthlyReportRef =
  gqlSchemaBuilder.objectRef<StudentMonthlyReportReturnType>("StudentMonthlyReport");

export const StudentMonthlyReportPothosObject = StudentMonthlyReportRef.implement({
  description: "Monthly report aggregating student attendance, lessons, and credit ledger activity.",
  fields: t => ({
    id: t.exposeString("studentId"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    year: t.exposeInt("year"),
    month: t.exposeInt("month"),
    totalLessons: t.exposeInt("totalLessons"),
    completedLessons: t.exposeInt("completedLessons"),
    cancelledLessons: t.exposeInt("cancelledLessons"),
    presentCount: t.exposeInt("presentCount"),
    absentCount: t.exposeInt("absentCount"),
    lateCount: t.exposeInt("lateCount"),
    totalHours: t.exposeFloat("totalHours"),
    creditsPurchased: t.exposeInt("creditsPurchased"),
    creditsDeducted: t.exposeInt("creditsDeducted"),
    creditsRefunded: t.exposeInt("creditsRefunded"),
    creditsBalance: t.exposeInt("creditsBalance"),
  }),
});
