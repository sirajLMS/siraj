import { StudentMonthlyReportPothosObject } from "@/backend/graphql/pothos/reports/monthly-report.pothos";
import { TeacherMonthlyReportPothosObject } from "@/backend/graphql/pothos/teachers/teacher-due.pothos";
import {
  makeStudentMonthlyReportQueryField,
  makeTeacherMonthlyReportQueryField,
} from "@/backend/graphql/query/reports/__shared__/makeMonthlyReportQueryField";
import { StudentMonthlyReportService, TeacherMonthlyReportService } from "@/backend/services";

makeTeacherMonthlyReportQueryField({
  fieldName: "teacherMonthlyReport",
  returnType: TeacherMonthlyReportPothosObject,
  description: "Aggregated monthly report for a single teacher: lessons taught, dues, and cancellation count.",
  getReport: (userId, teacherId, year, month, locale) =>
    TeacherMonthlyReportService.getMonthlyReport(userId, teacherId, year, month, locale),
});

makeStudentMonthlyReportQueryField({
  fieldName: "studentMonthlyReport",
  returnType: StudentMonthlyReportPothosObject,
  description: "Aggregated monthly report for a single student: attendance, lessons, and credit ledger activity.",
  getReport: (userId, studentId, year, month, locale) =>
    StudentMonthlyReportService.getMonthlyReport(userId, studentId, year, month, locale),
});
