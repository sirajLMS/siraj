import type { StudentFieldGroupKey } from "@/shared/constants/profile-field-groups";

const STUDENT_PROFILE_TABS = ["profile", "status", "classes", "quota", "credit-hours", "history"] as const;

export type StudentProfileTab = (typeof STUDENT_PROFILE_TABS)[number];

const PROFILE_TAB_GROUPS: readonly StudentFieldGroupKey[] = ["student_identity", "student_parent"];

const STATUS_TAB_GROUPS: readonly StudentFieldGroupKey[] = [
  "student_identity",
  "student_academic",
  "student_teacher",
  "student_parent",
];

const CLASSES_TAB_GROUPS: readonly StudentFieldGroupKey[] = ["student_schedule"];

const QUOTA_TAB_GROUPS: readonly StudentFieldGroupKey[] = ["student_identity", "student_quota_edit", "student_teacher"];

/** Credit-hours tab mirrors the quota tab's audience: managers + assigned teachers. */
const CREDIT_HOURS_TAB_GROUPS: readonly StudentFieldGroupKey[] = [
  "student_identity",
  "student_quota_edit",
  "student_teacher",
];

const HISTORY_TAB_GROUPS: readonly StudentFieldGroupKey[] = ["student_history"];

const TAB_GROUP_MAP: Record<StudentProfileTab, readonly StudentFieldGroupKey[]> = {
  profile: PROFILE_TAB_GROUPS,
  status: STATUS_TAB_GROUPS,
  classes: CLASSES_TAB_GROUPS,
  quota: QUOTA_TAB_GROUPS,
  "credit-hours": CREDIT_HOURS_TAB_GROUPS,
  history: HISTORY_TAB_GROUPS,
};

const STUDENT_PROFILE_TAB_SET = new Set<string>(STUDENT_PROFILE_TABS);

export function isStudentProfileTab(value: string | null): value is StudentProfileTab {
  return value !== null && STUDENT_PROFILE_TAB_SET.has(value);
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
