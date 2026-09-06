/**
 * Client-facing mirror of the expense type classification used by the
 * expense ledger. Values must stay in lockstep with the backend enum and
 * the `expense_type` PostgreSQL enum.
 */
export enum ExpenseType {
  SALARIES = "Salaries",
  MARKETING = "Marketing",
  LOGISTICS = "Logistics",
  TECHNOLOGY = "Technology",
}
