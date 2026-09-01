import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CalculationStatusPothosEnum, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { PayrollOverrideResult, PayrollReportFilters, PayrollReportPage, PayrollReportRow } from "@/backend/types";

// ─── Input: Payroll Report Filter ────────────────────────────────────────────

export const PayrollReportFilterPothosInput = gqlSchemaBuilder
  .inputRef<PayrollReportFilters>("PayrollReportFilter")
  .implement({
    description:
      "AND-combined filters narrowing the payroll report to a teacher, student, date range, statuses, or free-text search",
    fields: t => ({
      teacherId: t.id({ required: false }),
      studentId: t.id({ required: false }),
      dateFrom: t.string({ required: false, directives: { constraint: { format: "date" } } }),
      dateTo: t.string({ required: false, directives: { constraint: { format: "date" } } }),
      calculationStatuses: t.field({ type: [CalculationStatusPothosEnum], required: false }),
      search: t.string({ required: false, directives: { constraint: { maxLength: 200 } } }),
    }),
  });

// ─── Report Row ──────────────────────────────────────────────────────────────

export const PayrollReportRowRef = gqlSchemaBuilder.objectRef<PayrollReportRow>("PayrollReportRow");

export const PayrollReportRowPothosObject = PayrollReportRowRef.implement({
  description: "One class instance flattened with teacher, student, and subject names for the payroll report",
  fields: t => ({
    id: t.field({ type: "ID", resolve: row => row.instanceId }),
    instanceId: t.exposeID("instanceId"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    scheduledDurationMinutes: t.exposeInt("scheduledDurationMinutes"),
    actualStartAt: t.expose("actualStartAt", { type: "DateTime", nullable: true }),
    actualEndAt: t.expose("actualEndAt", { type: "DateTime", nullable: true }),
    calculatedDuration: t.exposeInt("calculatedDuration", { nullable: true }),
    teacherPaidAmount: t.exposeString("teacherPaidAmount", { nullable: true }),
    teacherPaidCurrency: t.expose("teacherPaidCurrency", { type: CurrencyCodePothosObject, nullable: true }),
    calculationStatus: t.expose("calculationStatus", { type: CalculationStatusPothosEnum }),
    isPartialPercentage: t.exposeInt("isPartialPercentage", { nullable: true }),
    payrollNote: t.exposeString("payrollNote", { nullable: true }),
    teacherId: t.exposeID("teacherId"),
    teacherName: t.exposeString("teacherName"),
    studentId: t.exposeID("studentId"),
    studentName: t.exposeString("studentName"),
    subjectId: t.exposeID("subjectId"),
    subjectName: t.exposeString("subjectName"),
    isStudentAbsence: t.exposeBoolean("isStudentAbsence"),
    isTeacherAbsence: t.exposeBoolean("isTeacherAbsence"),
  }),
});

// ─── Report Aggregates ───────────────────────────────────────────────────────

export const PayrollReportAggregatesRef =
  gqlSchemaBuilder.objectRef<PayrollReportPage["aggregates"]>("PayrollReportAggregates");

export const PayrollReportAggregatesPothosObject = PayrollReportAggregatesRef.implement({
  description:
    "Totals over the full filtered payroll set (not just the returned page): paid amount, dominant currency, and row counts per calculation status",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "payroll-report-aggregates" }),
    totalPaidAmount: t.exposeString("totalPaidAmount"),
    totalPaidCurrency: t.expose("totalPaidCurrency", { type: CurrencyCodePothosObject }),
    rowCountByStatus: t.field({
      type: "JSON",
      resolve: aggregates => aggregates.rowCountByStatus,
    }),
  }),
});

// ─── Report Page ─────────────────────────────────────────────────────────────

export const PayrollReportPageRef = gqlSchemaBuilder.objectRef<PayrollReportPage>("PayrollReportPage");

export const PayrollReportPagePothosObject = PayrollReportPageRef.implement({
  description: "One page of the payroll report plus aggregates over the full filtered set",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "payroll-report-page" }),
    rows: t.expose("rows", { type: [PayrollReportRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    aggregates: t.expose("aggregates", { type: PayrollReportAggregatesPothosObject }),
  }),
});

// ─── Input: Payroll Override ─────────────────────────────────────────────────

export const PayrollOverrideInputPothos = gqlSchemaBuilder.inputType("PayrollOverrideInput", {
  description:
    "Client-supplied fields for overriding a class instance's payroll calculation. The acting operator is resolved from the request context and is never accepted as input.",
  fields: t => ({
    instanceId: t.id({ required: true }),
    targetStatus: t.field({ type: CalculationStatusPothosEnum, required: true }),
    partialPercentage: t.int({ required: false, directives: { constraint: { min: 0, max: 100 } } }),
    note: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
    force: t.boolean({ required: false }),
    clientRequestId: t.string({ required: false }),
  }),
});

// ─── Override Result ─────────────────────────────────────────────────────────

export const PayrollOverrideResultRef = gqlSchemaBuilder.objectRef<PayrollOverrideResult>("PayrollOverrideResult");

export const PayrollOverrideResultPothosObject = PayrollOverrideResultRef.implement({
  description:
    "Payroll snapshot of a class instance after an operator override, with the audit event id of the emitted override record",
  fields: t => ({
    id: t.field({ type: "ID", resolve: result => result.instanceId }),
    instanceId: t.exposeID("instanceId"),
    calculationStatus: t.expose("calculationStatus", { type: CalculationStatusPothosEnum }),
    teacherPaidAmount: t.exposeString("teacherPaidAmount", { nullable: true }),
    teacherPaidCurrency: t.expose("teacherPaidCurrency", { type: CurrencyCodePothosObject, nullable: true }),
    calculatedDuration: t.exposeInt("calculatedDuration", { nullable: true }),
    isPartialPercentage: t.exposeInt("isPartialPercentage", { nullable: true }),
    payrollNote: t.exposeString("payrollNote", { nullable: true }),
    auditEventId: t.exposeID("auditEventId"),
  }),
});
