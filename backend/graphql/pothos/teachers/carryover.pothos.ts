import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CalculationStatusPothosEnum, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { carryoverInputFields } from "@/backend/graphql/pothos/teachers/__shared__/carryoverFieldHelpers";
import { CarryoverBalanceService } from "@/backend/services";
import type {
  BulkCreateCarryoverGroupResult,
  BulkCreateCarryoverResult,
  BulkDeleteCarryoverResult,
  BulkToExpenseItemResult,
  BulkToExpenseResult,
  CarryoverLinkedSession,
  CarryoverPage,
  CarryoverRow,
  DeleteCarryoverResult,
} from "@/backend/types";

// ─── Carryover Row ───────────────────────────────────────────────────────────

export const CarryoverBalanceRef = gqlSchemaBuilder.objectRef<CarryoverRow>("CarryoverBalance");

export const CarryoverBalancePothosObject = CarryoverBalanceRef.implement({
  description:
    "One carryover balance row: audited class instances aggregated for a teacher into a single payable record, with the resolved teacher display fields",
  fields: t => ({
    id: t.exposeID("id"),
    teacherId: t.exposeID("teacherId"),
    teacherName: t.exposeString("teacherName"),
    teacherAvatarUrl: t.exposeString("teacherAvatarUrl", { nullable: true }),
    studentsCount: t.exposeInt("studentsCount", { nullable: true }),
    studentsText: t.exposeString("studentsText", { nullable: true }),
    totalDuration: t.exposeString("totalDuration", { nullable: true }),
    payable: t.exposeString("payable"),
    teacherCurrency: t.expose("teacherCurrency", { type: CurrencyCodePothosObject }),
    paid: t.exposeString("paid"),
    fromDate: t.exposeString("fromDate", { nullable: true }),
    toDate: t.exposeString("toDate", { nullable: true }),
    paymentDate: t.exposeString("paymentDate", { nullable: true }),
    isDisabledTeacher: t.exposeBoolean("isDisabledTeacher"),
    isPaid: t.exposeBoolean("isPaid"),
    expenseId: t.exposeID("expenseId", { nullable: true }),
    note: t.exposeString("note", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    paidAt: t.expose("paidAt", { type: "DateTime", nullable: true }),
    // Batched per page via DataLoader; the count resolves through the
    // carryover item snapshots, so it stays correct even if sessions were
    // unlinked afterwards.
    linkedSessionCount: t.loadable({
      type: "Int",
      description: "Number of class instances aggregated into this carryover balance",
      load: async (carryoverIds: string[]) => {
        const counts = await CarryoverBalanceService.countLinkedSessionsByCarryoverIds(carryoverIds);
        return carryoverIds.map(id => counts.get(id) ?? 0);
      },
      resolve: carryover => carryover.id,
    }),
  }),
});

// ─── Linked Sessions ─────────────────────────────────────────────────────────

export const CarryoverLinkedSessionRef = gqlSchemaBuilder.objectRef<CarryoverLinkedSession>("CarryoverLinkedSession");

export const CarryoverLinkedSessionPothosObject = CarryoverLinkedSessionRef.implement({
  description:
    "One class instance aggregated into a carryover balance, with the student and subject display fields, the link-time amount/status snapshot, and the session's current calculation status",
  fields: t => ({
    id: t.exposeID("id"),
    studentId: t.exposeID("studentId"),
    studentName: t.exposeString("studentName"),
    subjectName: t.exposeString("subjectName"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    originalAmount: t.exposeString("originalAmount"),
    originalCurrency: t.expose("originalCurrency", { type: CurrencyCodePothosObject }),
    originalStatus: t.exposeString("originalStatus"),
    currentStatus: t.expose("currentStatus", { type: CalculationStatusPothosEnum }),
  }),
});

// ─── Report Aggregates ───────────────────────────────────────────────────────

export const CarryoverAggregatesRef = gqlSchemaBuilder.objectRef<CarryoverPage["aggregates"]>("CarryoverAggregates");

export const CarryoverAggregatesPothosObject = CarryoverAggregatesRef.implement({
  description:
    "Totals over the full filtered carryover set (not just the returned page): payable, paid, dominant currency, and row counts per paid status",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "carryover-aggregates" }),
    totalPayable: t.exposeString("totalPayable"),
    totalPaid: t.exposeString("totalPaid"),
    dominantCurrency: t.expose("dominantCurrency", { type: CurrencyCodePothosObject }),
    rowCountByPaid: t.field({
      type: "JSON",
      resolve: aggregates => aggregates.rowCountByPaid,
    }),
  }),
});

// ─── Report Page ─────────────────────────────────────────────────────────────

export const CarryoverPageRef = gqlSchemaBuilder.objectRef<CarryoverPage>("CarryoverPage");

export const CarryoverPagePothosObject = CarryoverPageRef.implement({
  description: "One page of the carryover balance list plus aggregates over the full filtered set",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "carryover-page" }),
    rows: t.expose("rows", { type: [CarryoverBalancePothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    aggregates: t.expose("aggregates", { type: CarryoverAggregatesPothosObject }),
  }),
});

// ─── Bulk Create Results ─────────────────────────────────────────────────────

export const BulkCreateCarryoverGroupResultRef = gqlSchemaBuilder.objectRef<BulkCreateCarryoverGroupResult>(
  "BulkCreateCarryoverGroupResult"
);

export const BulkCreateCarryoverGroupResultPothosObject = BulkCreateCarryoverGroupResultRef.implement({
  description: "Outcome of grouping one teacher's audited class instances into a single carryover balance",
  fields: t => ({
    id: t.exposeID("carryoverId"),
    teacherId: t.exposeID("teacherId"),
    carryoverId: t.exposeID("carryoverId"),
    studentsCount: t.exposeInt("studentsCount"),
    totalDuration: t.exposeString("totalDuration"),
    payable: t.exposeString("payable"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    instanceIds: t.expose("instanceIds", { type: ["ID"] }),
  }),
});

export const BulkCreateCarryoverResultRef =
  gqlSchemaBuilder.objectRef<BulkCreateCarryoverResult>("BulkCreateCarryoverResult");

export const BulkCreateCarryoverResultPothosObject = BulkCreateCarryoverResultRef.implement({
  description: "Outcome of a bulk carryover creation across all affected teacher groups",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "bulk-create-carryover-result" }),
    groups: t.expose("groups", { type: [BulkCreateCarryoverGroupResultPothosObject] }),
    totalInstanceIds: t.expose("totalInstanceIds", { type: ["ID"] }),
    auditLogIds: t.expose("auditLogIds", { type: ["ID"] }),
  }),
});

// ─── Bulk To-Expense Results ─────────────────────────────────────────────────

export const BulkToExpenseItemResultRef =
  gqlSchemaBuilder.objectRef<BulkToExpenseItemResult>("BulkToExpenseItemResult");

export const BulkToExpenseItemResultPothosObject = BulkToExpenseItemResultRef.implement({
  description: "Outcome of converting one carryover balance into its expense record",
  fields: t => ({
    id: t.exposeID("expenseId"),
    carryoverId: t.exposeID("carryoverId"),
    expenseId: t.exposeID("expenseId"),
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
  }),
});

export const BulkToExpenseResultRef = gqlSchemaBuilder.objectRef<BulkToExpenseResult>("BulkToExpenseResult");

export const BulkToExpenseResultPothosObject = BulkToExpenseResultRef.implement({
  description: "Outcome of a bulk carryover-to-expense conversion across all affected carryovers",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "bulk-to-expense-result" }),
    items: t.expose("items", { type: [BulkToExpenseItemResultPothosObject] }),
    auditLogIds: t.expose("auditLogIds", { type: ["ID"] }),
  }),
});

// ─── Delete Results ──────────────────────────────────────────────────────────

export const DeleteResultRef = gqlSchemaBuilder.objectRef<DeleteCarryoverResult>("CarryoverDeleteResult");

export const DeleteResultPothosObject = DeleteResultRef.implement({
  description: "Outcome of deleting a single carryover balance",
  fields: t => ({
    id: t.exposeID("id"),
    deleted: t.exposeBoolean("deleted"),
  }),
});

export const BulkDeleteResultRef = gqlSchemaBuilder.objectRef<BulkDeleteCarryoverResult>("BulkDeleteCarryoverResult");

export const BulkDeleteResultPothosObject = BulkDeleteResultRef.implement({
  description: "Outcome of a batch carryover deletion, listing the removed carryover ids",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "bulk-delete-carryover-result" }),
    deletedIds: t.expose("deletedIds", { type: ["ID"] }),
    auditLogIds: t.expose("auditLogIds", { type: ["ID"] }),
  }),
});

// ─── Inputs ──────────────────────────────────────────────────────────────────

export const CarryoverFilterPothosInput = gqlSchemaBuilder.inputType("CarryoverFilter", {
  description:
    "AND-combined filters narrowing the carryover list to a teacher, paid status, date range, or free-text search over the teacher name and students text",
  fields: t => ({
    teacherId: t.id({ required: false }),
    paidStatus: t.string({ required: false }),
    dateFrom: t.string({ required: false, directives: { constraint: { format: "date" } } }),
    dateTo: t.string({ required: false, directives: { constraint: { format: "date" } } }),
    includeDisabledTeachers: t.boolean({ required: false }),
    search: t.string({ required: false, directives: { constraint: { maxLength: 200 } } }),
  }),
});

export const BulkCreateCarryoverInputPothos = gqlSchemaBuilder.inputType("BulkCreateCarryoverInput", {
  description:
    "Bulk carryover creation over audited class instances. The acting operator is resolved from the request context and is never accepted as input.",
  fields: t => ({
    instanceIds: t.field({
      type: ["ID"],
      required: true,
      directives: { constraint: { maxItems: 500 } },
    }),
    clientRequestId: t.string({ required: false }),
    note: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
  }),
});

export const BulkToExpenseInputPothos = gqlSchemaBuilder.inputType("BulkToExpenseInput", {
  description:
    "Bulk conversion of unpaid carryover balances into expense records. The acting operator is resolved from the request context and is never accepted as input.",
  fields: t => ({
    carryoverIds: t.field({ type: ["ID"], required: true, directives: { constraint: { maxItems: 500 } } }),
    paymentDate: t.string({ required: true, directives: { constraint: { format: "date" } } }),
    expenseDate: t.string({ required: false }),
    note: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
    clientRequestId: t.string({ required: false }),
  }),
});

export const CreateCarryoverInputPothos = gqlSchemaBuilder.inputType("CreateCarryoverInput", {
  description:
    "Manual creation of a single carryover balance. The acting operator is resolved from the request context and is never accepted as input.",
  fields: t => ({
    teacherId: t.id({ required: true }),
    ...carryoverInputFields(t, { payable: true, teacherCurrency: true }),
    clientRequestId: t.string({ required: false }),
  }),
});

export const UpdateCarryoverInputPothos = gqlSchemaBuilder.inputType("UpdateCarryoverInput", {
  description:
    "Field-level patch for a carryover balance; only the provided fields change. The acting operator is resolved from the request context and is never accepted as input.",
  fields: t => ({
    id: t.id({ required: true }),
    ...carryoverInputFields(t, { payable: false, teacherCurrency: false }),
  }),
});
