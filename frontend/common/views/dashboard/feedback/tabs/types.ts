export type FeedbackManageTabId = "complaints" | "suggestions";
export type FeedbackManageTabLabelKey = "complaints" | "suggestions";
export type FeedbackManageTabsLabels = Record<FeedbackManageTabLabelKey, string>;
export interface FeedbackManageViewLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly tabs: FeedbackManageTabsLabels;
}
export type FeedbackManageTabsViewModel = {
  readonly labels: FeedbackManageViewLabels;
  readonly activeTab: FeedbackManageTabId;
  readonly tabNavItems: readonly { readonly id: FeedbackManageTabId; readonly label: string; readonly href: string }[];
};
export const FEEDBACK_MANAGE_TAB_IDS: readonly FeedbackManageTabId[] = ["complaints", "suggestions"] as const;
