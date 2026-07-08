import type { ProfileAudience, ProfileScope } from "@/backend/types/profile.types";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";

export type ProfileTabId = "profile" | "banking" | "students" | "notifications" | "permissions";

export type ProfileTabDefinition = {
  readonly id: ProfileTabId;
  readonly i18nKey: `shell.tabs.${string}`;
};

type TabVisibilityKey = `${ProfileAudience}-${ProfileScope}`;

const TAB_VISIBILITY: Record<ProfileTabId, readonly TabVisibilityKey[]> = {
  profile: ["teacher-own", "teacher-other", "parent-own", "parent-other", "staff-own", "staff-other"],
  banking: ["teacher-other"],
  students: ["teacher-other"],
  notifications: ["teacher-own", "parent-own", "staff-own"],
  permissions: ["teacher-other", "parent-other", "staff-other"],
};

export const profileTabs: readonly ProfileTabDefinition[] = [
  { id: "profile", i18nKey: "shell.tabs.profile" },
  { id: "banking", i18nKey: "shell.tabs.banking" },
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

    return true;
  });
}
