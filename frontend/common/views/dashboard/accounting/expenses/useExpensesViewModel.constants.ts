import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";

/** Route that streams the filtered expense list as a CSV download. */
export const EXPENSES_EXPORT_URL = "/api/expenses/export";

/** Used when the export response carries no Content-Disposition filename. */
export const FALLBACK_EXPORT_FILENAME = "expenses.csv";

/**
 * The export route validates `types` against the backend enum's display values
 * ("Salaries", …), while the store and query variables carry the GraphQL enum
 * (serialized "SALARIES", …) — so only the export path needs to translate.
 */
export const EXPENSE_TYPE_EXPORT_VALUE: Record<ExpenseType, string> = {
  [ExpenseType.Salaries]: "Salaries",
  [ExpenseType.Marketing]: "Marketing",
  [ExpenseType.Logistics]: "Logistics",
  [ExpenseType.Technology]: "Technology",
};
