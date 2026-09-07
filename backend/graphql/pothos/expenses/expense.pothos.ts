import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject, ExpenseTypePothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { BulkDeleteExpensesResult, DeleteExpenseResult, ExpensePage, ExpenseRow } from "@/backend/types";

// ─── Expense Row ─────────────────────────────────────────────────────────────

export const ExpenseRef = gqlSchemaBuilder.objectRef<ExpenseRow>("Expense");

export const ExpensePothosObject = ExpenseRef.implement({
  description:
    "One expense ledger row: a manual operational spend entry or a salary payout written by the carryover settlement flow (sourceEntity/sourceEntityId provenance), with the creator's display name resolved",
  fields: t => ({
    id: t.exposeID("id"),
    teacherId: t.exposeID("teacherId", { nullable: true }),
    teacherName: t.exposeString("teacherName", { nullable: true }),
    title: t.exposeString("title"),
    type: t.expose("type", { type: ExpenseTypePothosEnum }),
    expenseValue: t.exposeString("expenseValue"),
    expenseCurrency: t.expose("expenseCurrency", { type: CurrencyCodePothosObject }),
    paymentDate: t.exposeString("paymentDate"),
    expenseDate: t.exposeString("expenseDate"),
    note: t.exposeString("note", { nullable: true }),
    sourceEntity: t.exposeString("sourceEntity", { nullable: true }),
    sourceEntityId: t.exposeID("sourceEntityId", { nullable: true }),
    createdByUserId: t.exposeID("createdByUserId"),
    createdByName: t.exposeString("createdByName"),
    deletedAt: t.expose("deletedAt", { type: "DateTime", nullable: true }),
    deletedByUserId: t.exposeID("deletedByUserId", { nullable: true }),
    deletedReason: t.exposeString("deletedReason", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── Report Page ─────────────────────────────────────────────────────────────

export const ExpensePageRef = gqlSchemaBuilder.objectRef<ExpensePage>("ExpensePage");

export const ExpensePagePothosObject = ExpensePageRef.implement({
  description:
    "One page of the expense ledger list plus the page's aggregates (total value, dominant currency, row counts per expense type)",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "expense-page" }),
    rows: t.expose("rows", { type: [ExpensePothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    totalValue: t.field({ type: "String", resolve: page => page.aggregates.totalValue }),
    dominantCurrency: t.field({
      type: CurrencyCodePothosObject,
      resolve: page => page.aggregates.dominantCurrency,
    }),
    rowCountByType: t.field({ type: "JSON", resolve: page => page.aggregates.rowCountByType }),
  }),
});

// ─── Delete Results ──────────────────────────────────────────────────────────

export const ExpenseDeleteResultRef = gqlSchemaBuilder.objectRef<DeleteExpenseResult>("ExpenseDeleteResult");

export const ExpenseDeleteResultPothosObject = ExpenseDeleteResultRef.implement({
  description: "Outcome of soft-deleting a single expense",
  fields: t => ({
    id: t.exposeID("id"),
    deleted: t.exposeBoolean("deleted"),
  }),
});

export const ExpenseBulkDeleteResultRef =
  gqlSchemaBuilder.objectRef<BulkDeleteExpensesResult>("BulkDeleteExpensesResult");

export const ExpenseBulkDeleteResultPothosObject = ExpenseBulkDeleteResultRef.implement({
  description: "Outcome of an atomic batch expense deletion, listing the removed expense ids",
  fields: t => ({
    id: t.field({ type: "ID", resolve: () => "bulk-delete-expenses-result" }),
    deleted: t.expose("deleted", { type: ["ID"] }),
    auditLogIds: t.expose("auditLogIds", { type: ["ID"] }),
  }),
});

// ─── Inputs ──────────────────────────────────────────────────────────────────

export const ExpenseFilterPothosInput = gqlSchemaBuilder.inputType("ExpenseFilter", {
  description:
    "AND-combined filters narrowing the expense list by title, type, accounting month, payment-date range, or soft-deleted inclusion",
  fields: t => ({
    title: t.string({ required: false }),
    types: t.field({ type: [ExpenseTypePothosEnum], required: false }),
    expenseDate: t.string({ required: false }),
    paymentDateFrom: t.string({ required: false, directives: { constraint: { format: "date" } } }),
    paymentDateTo: t.string({ required: false, directives: { constraint: { format: "date" } } }),
    includeDeleted: t.boolean({ required: false }),
  }),
});

export const CreateExpenseInputPothos = gqlSchemaBuilder.inputType("CreateExpenseInput", {
  description:
    "Manual creation of a single expense. The acting operator is resolved from the request context and is never accepted as input. Salaries-type expenses are rejected here; they are written only by the carryover settlement flow.",
  fields: t => ({
    teacherId: t.id({ required: false }),
    title: t.string({ required: true, directives: { constraint: { maxLength: 200 } } }),
    type: t.field({ type: ExpenseTypePothosEnum, required: true }),
    expenseValue: t.string({ required: true }),
    expenseCurrency: t.field({ type: CurrencyCodePothosObject, required: true }),
    paymentDate: t.string({ required: true, directives: { constraint: { format: "date" } } }),
    expenseDate: t.string({ required: true }),
    note: t.string({ required: false }),
    clientRequestId: t.string({ required: false }),
  }),
});

export const UpdateExpenseInputPothos = gqlSchemaBuilder.inputType("UpdateExpenseInput", {
  description:
    "Field-level patch for an expense; only the provided fields change. The acting operator is resolved from the request context and is never accepted as input.",
  fields: t => ({
    id: t.id({ required: true }),
    title: t.string({ required: false, directives: { constraint: { maxLength: 200 } } }),
    type: t.field({ type: ExpenseTypePothosEnum, required: false }),
    expenseValue: t.string({ required: false }),
    expenseCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
    paymentDate: t.string({ required: false, directives: { constraint: { format: "date" } } }),
    expenseDate: t.string({ required: false }),
    note: t.string({ required: false }),
    teacherId: t.id({ required: false }),
    teacherName: t.string({ required: false }),
  }),
});

export const DeleteExpenseInputPothos = gqlSchemaBuilder.inputType("DeleteExpenseInput", {
  description:
    "Soft-delete of a single expense with an optional operator reason. The acting operator is resolved from the request context and is never accepted as input.",
  fields: t => ({
    id: t.id({ required: true }),
    reason: t.string({ required: false }),
  }),
});

export const BulkDeleteExpensesInputPothos = gqlSchemaBuilder.inputType("BulkDeleteExpensesInput", {
  description:
    "Atomic soft-delete of a batch of expenses with an optional operator reason. The acting operator is resolved from the request context and is never accepted as input.",
  fields: t => ({
    ids: t.field({
      type: ["ID"],
      required: true,
      directives: { constraint: { maxItems: 500 } },
    }),
    reason: t.string({ required: false }),
  }),
});
