import type { AccountingPaymentFilterInput } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  AccountingPaymentRow,
  PaymentsFilterFields,
  PaymentsListMetrics,
} from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel.types";

/** Hard transport cap per fetch — the catalog stays small; client paginates. */
export const MAX_FETCH_ROWS = 500;

/** Filter fields as read before normalization; `unpaidOnly` may be absent (null) on the wire. */
interface PaymentsListFilterFields {
  readonly studentId: string | null;
  readonly parentId: string | null;
  readonly fromDate: string | null;
  readonly toDate: string | null;
  readonly unpaidOnly: boolean | null;
}

/** True when at least one list filter is actively constraining the query. */
export function hasAnyListFilter(v: PaymentsListFilterFields): boolean {
  return [
    v.studentId !== null && v.studentId !== "",
    v.parentId !== null && v.parentId !== "",
    v.fromDate !== null && v.fromDate !== "",
    v.toDate !== null && v.toDate !== "",
    v.unpaidOnly === true,
  ].includes(true);
}

/** Pure aggregation over fetched rows for the payments summary strip. */
export function computePaymentListMetrics(rows: readonly AccountingPaymentRow[]): PaymentsListMetrics {
  let paid = 0;
  let creditHours = 0;
  for (const row of rows) {
    if (row.isPaidStatusOn) paid += 1;
    creditHours += Number(row.creditHours ?? 0);
  }
  return { total: rows.length, paid, unpaid: rows.length - paid, creditHours };
}

/** Maps the raw filter fields onto the GraphQL filter input (null when inactive). */
export function buildPaymentListFilter(v: PaymentsFilterFields): AccountingPaymentFilterInput | null {
  if (!hasAnyListFilter(v)) return null;
  return {
    studentId: v.studentId ?? null,
    parentId: v.parentId ?? null,
    fromDate: v.fromDate ?? null,
    toDate: v.toDate ?? null,
    unpaidOnly: v.unpaidOnly || null,
  };
}
