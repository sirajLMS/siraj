"use client";

import { AppPermission, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";
import { profileFieldGroupGraphqlPermission } from "@/shared/lib/field-group-permission-key";

type UseProfileFieldAccessOptions = {
  readonly scope?: ProfileScope;
};

const resolvePermission = (
  groupKey: ProfileFieldGroupKey,
  action: "view_own" | "view_other" | "edit_own" | "edit_other"
): AppPermission => {
  // profileFieldGroupGraphqlPermission returns a string that maps to AppPermission enum values.
  // The cast is safe because the function generates GraphQL permission names (e.g., "PROFILE_CORE_STATUS_EDIT_OWN")
  // that exactly match AppPermission enum members. Shared layer cannot import AppPermission due to layer separation.
  return profileFieldGroupGraphqlPermission(groupKey, action) as AppPermission;
};

export function useProfileFieldAccess(options: UseProfileFieldAccessOptions = {}) {
  const hasPermission = useUserStore(state => state.hasPermission);
  const scope = options.scope ?? ProfileScope.Own;

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

  const canViewField = (groupKey: ProfileFieldGroupKey): boolean => canView(groupKey);

  const showField = (_value: unknown, groupKey: ProfileFieldGroupKey): boolean => canViewField(groupKey);

  const canEditStatus = (): boolean => {
    const permission =
      scope === ProfileScope.Own
        ? resolvePermission("core_status", "edit_own")
        : resolvePermission("core_status", "edit_other");
    return hasPermission(permission);
  };

  const canAdminResetPassword = (): boolean => {
    return hasPermission(AppPermission.UserAdminResetPassword);
  };

  return { canView, canEdit, canViewField, showField, scope, canEditStatus, canAdminResetPassword };
}
