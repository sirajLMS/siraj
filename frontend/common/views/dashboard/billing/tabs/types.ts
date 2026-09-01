/** Billing tab identifiers — literal union for type-safe tab routing. */
export type BillingTabId = "overview" | "invoices" | "exchangeRates" | "currencies" | "hedges" | "manual";

/** I18n label keys (map to `dashboard.billing.tabs.*` namespace). */
export type BillingTabLabelKey = "overview" | "invoices" | "exchangeRates" | "currencies" | "hedges" | "manual";

type BillingTabsLabels = Record<BillingTabLabelKey, string>;

/** Full labels object consumed by the billing tier shells (page title + subtitle + tabs). */
export interface BillingViewLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly tabs: BillingTabsLabels;
  readonly tabNavAriaLabel: string;
}

export type BillingTabsViewModel = {
  readonly labels: BillingViewLabels;
  readonly activeTab: BillingTabId;
  readonly tabNavItems: readonly { readonly id: BillingTabId; readonly label: string; readonly href: string }[];
};

export const BILLING_TAB_IDS: readonly BillingTabId[] = [
  "overview",
  "invoices",
  "exchangeRates",
  "currencies",
  "hedges",
  "manual",
] as const;
