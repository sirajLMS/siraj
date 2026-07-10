"use client";

import { type AppPermission, ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { type ProfileFieldGroupKey, profileFieldPermissionKey } from "@/shared/constants/profile-field-groups";

type UseProfileFieldAccessOptions = {
  readonly scope?: ProfileScope;
};

export function useProfileFieldAccess(options: UseProfileFieldAccessOptions = {}) {
  const hasPermission = useUserStore(state => state.hasPermission);
  const scope = options.scope ?? ProfileScope.Own;

  const resolvePermission = (
    groupKey: ProfileFieldGroupKey,
    action: "view_own" | "view_other" | "edit_own" | "edit_other"
  ) => {
    return profileFieldPermissionKey(groupKey, action) as AppPermission;
  };

  const canView = (groupKey: ProfileFieldGroupKey): boolean => {
    const permission =
      scope === ProfileScope.Own ? resolvePermission(groupKey, "view_own") : resolvePermission(groupKey, "view_other");
    return hasPermission(permission);
  };

  const canEdit = (groupKey: ProfileFieldGroupKey): boolean => {
    const permission =
      scope === ProfileScope.Own ? resolvePermission(groupKey, "edit_own") : resolvePermission(groupKey, "edit_other");
    return hasPermission(permission);
  };

  const showField = (value: unknown, groupKey: ProfileFieldGroupKey): boolean => {
    if (!canView(groupKey)) {
      return false;
    }
    return value != null;
  };

  return { canView, canEdit, showField, scope };
}
