export type UsersDirectoryTabId = "teachers" | "parents" | "students" | "staff";
export type UsersDirectoryTabLabelKey = "teachers" | "parents" | "students" | "staff";
type UsersDirectoryTabsLabels = Record<UsersDirectoryTabLabelKey, string>;
export interface UsersDirectoryViewLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly tabs: UsersDirectoryTabsLabels;
  readonly createUserLabel: string;
  readonly tabNavAriaLabel: string;
}
export type UsersDirectoryTabsViewModel = {
  readonly labels: UsersDirectoryViewLabels;
  readonly activeTab: UsersDirectoryTabId;
  readonly tabNavItems: readonly { readonly id: UsersDirectoryTabId; readonly label: string; readonly href: string }[];
  readonly canCreateUser: boolean;
  readonly onCreateUser: () => void;
};
export const USERS_DIRECTORY_TAB_IDS: readonly UsersDirectoryTabId[] = [
  "teachers",
  "parents",
  "students",
  "staff",
] as const;
