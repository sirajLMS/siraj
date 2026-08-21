import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { ProfileAudience, ProfileScope } from "@/shared/constants/profile.enum";

export type ProfileTabId = "profile" | "paymentMethods" | "meeting" | "students" | "notifications" | "permissions";

export type ProfileTabDefinition = {
  readonly id: ProfileTabId;
  readonly i18nKey: `shell.tabs.${string}`;
};

type TabVisibilityKey = `${ProfileAudience}-${ProfileScope}`;

const STUDENT_OWN: TabVisibilityKey = "STUDENT-OWN";

const TAB_VISIBILITY: Record<ProfileTabId, readonly TabVisibilityKey[]> = {
  profile: [
    "TEACHER-OWN",
    "TEACHER-OTHER",
    "PARENT-OWN",
    "PARENT-OTHER",
    "STAFF-OWN",
    "STAFF-OTHER",
    STUDENT_OWN,
    "STUDENT-OTHER",
  ],
  paymentMethods: ["TEACHER-OWN", "TEACHER-OTHER", "PARENT-OWN", "PARENT-OTHER"],
  meeting: ["TEACHER-OWN", "TEACHER-OTHER", "PARENT-OWN", "PARENT-OTHER"],
  students: ["TEACHER-OTHER"],
  notifications: ["TEACHER-OWN", "PARENT-OWN", "STAFF-OWN", STUDENT_OWN],
  permissions: ["STAFF-OTHER"],
};

export const profileTabs: readonly ProfileTabDefinition[] = [
  { id: "profile", i18nKey: "shell.tabs.profile" },
  { id: "paymentMethods", i18nKey: "shell.tabs.paymentMethods" },
  { id: "meeting", i18nKey: "shell.tabs.meeting" },
  { id: "students", i18nKey: "shell.tabs.students" },
  { id: "notifications", i18nKey: "shell.tabs.notifications" },
  { id: "permissions", i18nKey: "shell.tabs.permissions" },
] as const;

function isPermissionsTabVisible(
  audience: ProfileAudience,
  scope: ProfileScope,
  hasPermission: (permission: AppPermission) => boolean
): boolean {
  const staffPermissions =
    audience === ProfileAudience.STAFF && scope === ProfileScope.OTHER
      ? hasPermission(AppPermission.ProfileStaffPermissionsViewOther)
      : false;
  const canEditOther = hasPermission(AppPermission.ProfileStaffPermissionsEditOther);
  return staffPermissions || canEditOther;
}

function isStudentsTabVisible(hasPermission: (permission: AppPermission) => boolean): boolean {
  return hasPermission(AppPermission.ProfileTeacherStudentsViewOther);
}

function isPaymentMethodsTabVisible(
  scope: ProfileScope,
  hasPermission: (permission: AppPermission) => boolean
): boolean {
  const viewPermission =
    scope === ProfileScope.OWN
      ? AppPermission.ProfilePaymentMethodsViewOwn
      : AppPermission.ProfilePaymentMethodsViewOther;
  return hasPermission(viewPermission);
}

function isMeetingTabVisible(scope: ProfileScope, hasPermission: (permission: AppPermission) => boolean): boolean {
  const viewPermission =
    scope === ProfileScope.OWN
      ? AppPermission.ProfileMeetingConfigsViewOwn
      : AppPermission.ProfileMeetingConfigsViewOther;
  const managePermission =
    scope === ProfileScope.OWN ? AppPermission.MeetingConfigsManageOwn : AppPermission.MeetingConfigsManageOther;
  return hasPermission(viewPermission) || hasPermission(managePermission);
}

function isTabPermitted(
  tab: ProfileTabDefinition,
  audience: ProfileAudience,
  scope: ProfileScope,
  hasPermission: (permission: AppPermission) => boolean
): boolean {
  switch (tab.id) {
    case "permissions":
      return isPermissionsTabVisible(audience, scope, hasPermission);
    case "students":
      return isStudentsTabVisible(hasPermission);
    case "paymentMethods":
      return isPaymentMethodsTabVisible(scope, hasPermission);
    case "meeting":
      return isMeetingTabVisible(scope, hasPermission);
    default:
      return true;
  }
}

export function getVisibleProfileTabs({
  audience,
  scope,
  hasPermission,
}: {
  readonly audience: ProfileAudience;
  readonly scope: ProfileScope;
  readonly hasPermission: (permission: AppPermission) => boolean;
}): ProfileTabDefinition[] {
  const visibilityKey: TabVisibilityKey = `${audience}-${scope}`;

  return profileTabs.filter(tab => {
    if (!TAB_VISIBILITY[tab.id].includes(visibilityKey)) {
      return false;
    }
    return isTabPermitted(tab, audience, scope, hasPermission);
  });
}

const PROFILE_TAB_IDS: readonly ProfileTabId[] = [
  "profile",
  "paymentMethods",
  "meeting",
  "students",
  "notifications",
  "permissions",
];

function isProfileTabId(value: string): value is ProfileTabId {
  return (PROFILE_TAB_IDS as readonly string[]).includes(value);
}

export function resolveProfileTab(
  tabParam: string | null,
  availableTabs: readonly ProfileTabDefinition[]
): ProfileTabId | undefined {
  if (tabParam !== null && isProfileTabId(tabParam) && availableTabs.some(tab => tab.id === tabParam)) {
    return tabParam;
  }
  return availableTabs[0]?.id;
}
