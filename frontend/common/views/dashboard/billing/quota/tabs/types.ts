/** Quota tab identifiers — literal union for type-safe tab routing. */
export type QuotaTabId = "allocations" | "insights";

/** I18n label keys (map to `dashboard.billingQuota.*` namespace). */
export type QuotaTabLabelKey = "listTitle" | "insights";

type QuotaTabsLabels = Record<QuotaTabLabelKey, string>;

/** Full labels object consumed by the quota tier shells (page title + tabs). */
export interface QuotaViewLabels {
  readonly title: string;
  readonly tabs: QuotaTabsLabels;
  readonly tabNavAriaLabel: string;
}

export type QuotaTabsViewModel = {
  readonly labels: QuotaViewLabels;
  readonly activeTab: QuotaTabId;
  readonly tabNavItems: readonly { readonly id: QuotaTabId; readonly label: string; readonly href: string }[];
};

export const QUOTA_TAB_IDS: readonly QuotaTabId[] = ["allocations", "insights"] as const;
