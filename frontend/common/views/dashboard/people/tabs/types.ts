export type PeopleDirectoryTabId = "teachers" | "parents" | "students" | "staff";
export type PeopleDirectoryTabLabelKey = "teachers" | "parents" | "students" | "staff";
export type PeopleDirectoryTabsLabels = Record<PeopleDirectoryTabLabelKey, string>;
export interface PeopleDirectoryViewLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly tabs: PeopleDirectoryTabsLabels;
}
export type PeopleDirectoryTabsViewModel = {
  readonly labels: PeopleDirectoryViewLabels;
  readonly activeTab: PeopleDirectoryTabId;
  readonly tabNavItems: readonly { readonly id: PeopleDirectoryTabId; readonly label: string; readonly href: string }[];
};
export const PEOPLE_DIRECTORY_TAB_IDS: readonly PeopleDirectoryTabId[] = [
  "teachers",
  "parents",
  "students",
  "staff",
] as const;
