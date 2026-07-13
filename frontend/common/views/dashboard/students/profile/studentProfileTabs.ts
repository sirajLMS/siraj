import type { StudentFieldGroupKey } from "@/shared/constants/profile-field-groups";

export const STUDENT_PROFILE_TABS = ["status", "quota", "history"] as const;

export type StudentProfileTab = (typeof STUDENT_PROFILE_TABS)[number];

const STATUS_TAB_GROUPS: readonly StudentFieldGroupKey[] = [
  "student_identity",
  "student_academic",
  "student_schedule",
  "student_teacher",
  "student_parent",
];

const QUOTA_TAB_GROUPS: readonly StudentFieldGroupKey[] = ["student_identity", "student_quota_edit", "student_teacher"];

const HISTORY_TAB_GROUPS: readonly StudentFieldGroupKey[] = ["student_history"];

const TAB_GROUP_MAP: Record<StudentProfileTab, readonly StudentFieldGroupKey[]> = {
  status: STATUS_TAB_GROUPS,
  quota: QUOTA_TAB_GROUPS,
  history: HISTORY_TAB_GROUPS,
};

export function isStudentProfileTab(value: string | null): value is StudentProfileTab {
  return STUDENT_PROFILE_TABS.includes(value as StudentProfileTab);
}

export function canViewStudentProfileTab(
  tab: StudentProfileTab,
  canView: (groupKey: StudentFieldGroupKey) => boolean
): boolean {
  return TAB_GROUP_MAP[tab].some(groupKey => canView(groupKey));
}

export function getVisibleStudentProfileTabs(
  canView: (groupKey: StudentFieldGroupKey) => boolean
): StudentProfileTab[] {
  return STUDENT_PROFILE_TABS.filter(tab => canViewStudentProfileTab(tab, canView));
}

export function resolveStudentProfileTab(
  tabParam: string | null,
  canView: (groupKey: StudentFieldGroupKey) => boolean
): StudentProfileTab | null {
  const visibleTabs = getVisibleStudentProfileTabs(canView);
  if (visibleTabs.length === 0) {
    return null;
  }

  if (isStudentProfileTab(tabParam) && visibleTabs.includes(tabParam)) {
    return tabParam;
  }

  return visibleTabs[0] ?? null;
}
