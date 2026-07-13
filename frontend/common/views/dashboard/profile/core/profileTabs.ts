import {
  AppPermission,
  type ProfileAudience,
  ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

export type ProfileTabId = "profile" | "paymentMethods" | "meeting" | "students" | "notifications" | "permissions";

export type ProfileTabDefinition = {
  readonly id: ProfileTabId;
  readonly i18nKey: `shell.tabs.${string}`;
};

type TabVisibilityKey = `${ProfileAudience}-${ProfileScope}`;

const TAB_VISIBILITY: Record<ProfileTabId, readonly TabVisibilityKey[]> = {
  profile: ["TEACHER-OWN", "TEACHER-OTHER", "PARENT-OWN", "PARENT-OTHER", "STAFF-OWN", "STAFF-OTHER"],
  paymentMethods: ["TEACHER-OWN", "TEACHER-OTHER", "PARENT-OWN", "PARENT-OTHER"],
  meeting: ["TEACHER-OWN", "TEACHER-OTHER", "PARENT-OWN", "PARENT-OTHER"],
  students: ["TEACHER-OTHER"],
  notifications: ["TEACHER-OWN", "PARENT-OWN", "STAFF-OWN"],
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

    if (tab.id === "permissions") {
      const staffPermissions =
        audience === "STAFF" && scope === ProfileScope.Other
          ? hasPermission(AppPermission.ProfileStaffPermissionsViewOther)
          : false;
      const legacyEdit = hasPermission(AppPermission.UserEditProfile);
      if (!staffPermissions && !legacyEdit) {
        return false;
      }
    }

    if (tab.id === "students" && !hasPermission(AppPermission.ProfileTeacherStudentsViewOther)) {
      return false;
    }

    if (tab.id === "paymentMethods") {
      const viewPermission =
        scope === ProfileScope.Own
          ? AppPermission.ProfilePaymentMethodsViewOwn
          : AppPermission.ProfilePaymentMethodsViewOther;
      if (!hasPermission(viewPermission)) {
        return false;
      }
    }

    if (tab.id === "meeting") {
      const viewPermission =
        scope === ProfileScope.Own
          ? AppPermission.ProfileMeetingConfigsViewOwn
          : AppPermission.ProfileMeetingConfigsViewOther;
      const managePermission =
        scope === ProfileScope.Own ? AppPermission.MeetingConfigsManageOwn : AppPermission.MeetingConfigsManageOther;
      if (!hasPermission(viewPermission) && !hasPermission(managePermission)) {
        return false;
      }
    }

    return true;
  });
}
