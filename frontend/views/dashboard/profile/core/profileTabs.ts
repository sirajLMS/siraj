import { AppPermission, type ProfileAudience, type ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";

export type ProfileTabId = "profile" | "paymentMethods" | "meeting" | "students" | "notifications" | "permissions";

export type ProfileTabDefinition = {
  readonly id: ProfileTabId;
  readonly i18nKey: `shell.tabs.${string}`;
};

type TabVisibilityKey = `${ProfileAudience}-${ProfileScope}`;

const TAB_VISIBILITY: Record<ProfileTabId, readonly TabVisibilityKey[]> = {
  profile: ["TEACHER-OWN", "TEACHER-OTHER", "PARENT-OWN", "PARENT-OTHER", "STAFF-OWN", "STAFF-OTHER"],
  paymentMethods: ["TEACHER-OWN", "TEACHER-OTHER"],
  meeting: ["TEACHER-OTHER"],
  students: ["TEACHER-OTHER"],
  notifications: ["TEACHER-OWN", "PARENT-OWN", "STAFF-OWN"],
  permissions: ["TEACHER-OTHER", "PARENT-OTHER", "STAFF-OTHER"],
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

    if (tab.id === "permissions" && !hasPermission(AppPermission.UserEditProfile)) {
      return false;
    }

    if (tab.id === "meeting" && !hasPermission(AppPermission.UserEditProfile)) {
      return false;
    }

    if (tab.id === "students" && !hasPermission(AppPermission.UserEditProfile)) {
      return false;
    }

    return true;
  });
}
