import type { AccountingPaymentsQuery_accountingPayments } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

/** One row of the accounting payments list (denormalized payment view). */
export type AccountingPaymentRow = AccountingPaymentsQuery_accountingPayments;

/** Summary figures computed over the loaded payment rows. */
export interface PaymentsListMetrics {
  readonly total: number;
  readonly paid: number;
  readonly unpaid: number;
  /** Sum of credit hours across loaded rows (unit-safe: hours, not currency). */
  readonly creditHours: number;
}

/** Narrow store slice for the payments list (fields + actions). */
export interface PaymentsFilterSlice {
  readonly studentId: string | null;
  readonly parentId: string | null;
  readonly fromDate: string | null;
  readonly toDate: string | null;
  readonly unpaidOnly: boolean;
  readonly setStudentId: (studentId: string | null) => void;
  readonly setParentId: (parentId: string | null) => void;
  readonly setFromDate: (fromDate: string | null) => void;
  readonly setToDate: (toDate: string | null) => void;
  readonly setUnpaidOnly: (unpaidOnly: boolean) => void;
  readonly resetFilters: () => void;
}

/** Fields-only view of the slice consumed by the GraphQL filter mapping. */
export type PaymentsFilterFields = Pick<
  PaymentsFilterSlice,
  "studentId" | "parentId" | "fromDate" | "toDate" | "unpaidOnly"
>;

/** Flat view model returned by `usePaymentsListViewModel`. */
export interface PaymentsListViewModel extends PaymentsFilterSlice {
  readonly t: PaymentsLabels;
  readonly rows: readonly AccountingPaymentRow[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly metrics: PaymentsListMetrics;
  readonly metricsBasis: string | null;
  readonly hasActiveFilters: boolean;
  /** True when the caller holds ACCOUNTING_PAYMENTS_MANAGE (create/edit/toggle). */
  readonly canManagePayments: boolean;
}
