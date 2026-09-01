export type PaymentCatalogsTabId = "paymentCatalogs" | "meetingProviders";
export type PaymentCatalogsTabLabelKey = "paymentCatalogs" | "meetingProviders";
type PaymentCatalogsTabsLabels = Record<PaymentCatalogsTabLabelKey, string>;
export interface PaymentCatalogsViewLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly tabs: PaymentCatalogsTabsLabels;
  readonly tabNavAriaLabel: string;
}
export type PaymentCatalogsTabsViewModel = {
  readonly labels: PaymentCatalogsViewLabels;
  readonly activeTab: PaymentCatalogsTabId;
  readonly tabNavItems: readonly { readonly id: PaymentCatalogsTabId; readonly label: string; readonly href: string }[];
};
export const PAYMENT_CATALOGS_TAB_IDS: readonly PaymentCatalogsTabId[] = [
  "paymentCatalogs",
  "meetingProviders",
] as const;
