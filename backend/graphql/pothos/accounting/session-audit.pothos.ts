import { SessionAuditStatusEnum } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CalculationStatusPothosEnum,
  CurrencyCodePothosObject,
  OrderSortDirectionPothosObject,
  SessionAuditReportSortFieldPothosEnum,
  SessionAuditStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  SessionAuditReportAggregates,
  SessionAuditReportPage,
  SessionAuditReportRow,
  SessionAuditStatus,
} from "@/backend/types";

/**
 * The report domain model holds the audit status as its canonical string
 * union; the GraphQL field exposes the registered enum, so the row type
 * travels through this lookup rather than a cast.
 */
const STATUS_TO_POTHOS_ENUM: Record<SessionAuditStatus, SessionAuditStatusEnum> = {
  open: SessionAuditStatusEnum.open,
  end: SessionAuditStatusEnum.end,
  Absent: SessionAuditStatusEnum.Absent,
  absent_student: SessionAuditStatusEnum.absent_student,
};

// ─── Input: Session Audit Report Filter ─────────────────────────────────────

export const SessionAuditReportFilterPothosInput = gqlSchemaBuilder.inputType("SessionAuditReportFilter", {
  description:
    "AND-combined filters narrowing the session audit report to a teacher, student, scheduled-date range, audit statuses, or free-text search",
  fields: t => ({
    teacherId: t.id({ required: false }),
    studentId: t.id({ required: false }),
    dateFrom: t.string({ required: false, directives: { constraint: { format: "date" } } }),
    dateTo: t.string({ required: false, directives: { constraint: { format: "date" } } }),
    currentStatuses: t.field({ type: [SessionAuditStatusPothosEnum], required: false }),
    search: t.string({ required: false, directives: { constraint: { maxLength: 200 } } }),
    includeDeleted: t.boolean({ required: false }),
  }),
});

// ─── Input: Session Audit Report Sort ───────────────────────────────────────

export const SessionAuditReportSortPothosInput = gqlSchemaBuilder.inputType("SessionAuditReportSort", {
  description: "Sort applied to the session audit report before pagination",
  fields: t => ({
    field: t.field({ type: SessionAuditReportSortFieldPothosEnum, required: true }),
    direction: t.field({ type: OrderSortDirectionPothosObject, required: true }),
  }),
});

// ─── Report Row ─────────────────────────────────────────────────────────────

export const SessionAuditReportRowRef = gqlSchemaBuilder.objectRef<SessionAuditReportRow>("SessionAuditReportRow");

export const SessionAuditReportRowPothosObject = SessionAuditReportRowRef.implement({
  description:
    "One class instance flattened with its derived audit status, payroll snapshot columns, and denormalized teacher, student, and subject names",
  fields: t => ({
    id: t.field({ type: "ID", resolve: row => row.instanceId }),
    instanceId: t.exposeID("instanceId"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    actualStartAt: t.expose("actualStartAt", { type: "DateTime", nullable: true }),
    actualEndAt: t.expose("actualEndAt", { type: "DateTime", nullable: true }),
    bookingTimezone: t.exposeString("bookingTimezone", { nullable: true }),
    currentStatus: t.field({
      type: SessionAuditStatusPothosEnum,
      resolve: row => STATUS_TO_POTHOS_ENUM[row.currentStatus],
    }),
    calculatedDuration: t.exposeInt("calculatedDuration", { nullable: true }),
    teacherPaidAmount: t.exposeString("teacherPaidAmount", { nullable: true }),
    teacherPaidCurrency: t.expose("teacherPaidCurrency", { type: CurrencyCodePothosObject, nullable: true }),
    calculationStatus: t.expose("calculationStatus", { type: CalculationStatusPothosEnum, nullable: true }),
    isPartialPercentage: t.exposeInt("isPartialPercentage", { nullable: true }),
    payrollNote: t.exposeString("payrollNote", { nullable: true }),
    payrollCalculatedAt: t.expose("payrollCalculatedAt", { type: "DateTime", nullable: true }),
    carryoverBalanceId: t.exposeID("carryoverBalanceId", { nullable: true }),
    teacherId: t.exposeID("teacherId"),
    teacherName: t.exposeString("teacherName"),
    studentId: t.exposeID("studentId"),
    studentName: t.exposeString("studentName"),
    subjectId: t.exposeID("subjectId"),
    subjectName: t.exposeString("subjectName"),
    teacherDuePaymentDate: t.expose("teacherDuePaymentDate", { type: "DateTime", nullable: true }),
  }),
});

// ─── Report Aggregates ──────────────────────────────────────────────────────

export const SessionAuditReportAggregatesRef =
  gqlSchemaBuilder.objectRef<SessionAuditReportAggregates>("SessionAuditReportAggregates");

export const SessionAuditReportAggregatesPothosObject = SessionAuditReportAggregatesRef.implement({
  description:
    "Aggregates over the rows of the returned page: status tallies cover every audit status, the paid split derives from the calculation status, and the paid amount is a precision-safe decimal string",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "session-audit-report-aggregates" }),
    rowCountByStatus: t.field({
      type: "JSON",
      resolve: aggregates => aggregates.rowCountByStatus,
    }),
    rowCountByPaid: t.field({
      type: "JSON",
      resolve: aggregates => aggregates.rowCountByPaid,
    }),
    totalPaidAmount: t.exposeString("totalPaidAmount"),
    totalPaidCurrency: t.expose("totalPaidCurrency", { type: CurrencyCodePothosObject }),
  }),
});

// ─── Report Page ────────────────────────────────────────────────────────────

export const SessionAuditReportPageRef = gqlSchemaBuilder.objectRef<SessionAuditReportPage>("SessionAuditReportPage");

export const SessionAuditReportPagePothosObject = SessionAuditReportPageRef.implement({
  description: "One page of the session audit report plus aggregates over the returned rows",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "session-audit-report-page" }),
    rows: t.expose("rows", { type: [SessionAuditReportRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    aggregates: t.expose("aggregates", { type: SessionAuditReportAggregatesPothosObject }),
  }),
});
