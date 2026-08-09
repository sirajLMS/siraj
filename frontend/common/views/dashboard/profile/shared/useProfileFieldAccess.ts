"use client";

import { AppPermission, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";
import { profileFieldGroupGraphqlPermission } from "@/shared/lib/field-group-permission-key";

type UseProfileFieldAccessOptions = {
  readonly scope?: ProfileScope;
};

const isAppPermission = (value: string): value is AppPermission => {
  return (Object.values(AppPermission) as readonly string[]).includes(value);
};

const resolvePermission = (
  groupKey: ProfileFieldGroupKey,
  action: "view_own" | "view_other" | "edit_own" | "edit_other"
): AppPermission | null => {
  const permStr = profileFieldGroupGraphqlPermission(groupKey, action);
  return isAppPermission(permStr) ? permStr : null;
};

export function useProfileFieldAccess(options: UseProfileFieldAccessOptions = {}) {
  const hasPermission = useUserStore(state => state.hasPermission);
  const scope = options.scope ?? ProfileScope.Own;

  const canView = (groupKey: ProfileFieldGroupKey): boolean => {
    const permission =
      scope === ProfileScope.Own ? resolvePermission(groupKey, "view_own") : resolvePermission(groupKey, "view_other");
    return permission ? hasPermission(permission) : false;
  };

  const canEdit = (groupKey: ProfileFieldGroupKey): boolean => {
    const permission =
      scope === ProfileScope.Own ? resolvePermission(groupKey, "edit_own") : resolvePermission(groupKey, "edit_other");
    return permission ? hasPermission(permission) : false;
  };

  const canViewField = (groupKey: ProfileFieldGroupKey): boolean => canView(groupKey);

  const showField = (_value: unknown, groupKey: ProfileFieldGroupKey): boolean => canViewField(groupKey);

  const canEditStatus = (): boolean => {
    const permission =
      scope === ProfileScope.Own
        ? resolvePermission("core_status", "edit_own")
        : resolvePermission("core_status", "edit_other");
    return permission ? hasPermission(permission) : false;
  };

  const canAdminResetPassword = (): boolean => {
    return hasPermission(AppPermission.UserAdminResetPassword);
  };

  return { canView, canEdit, canViewField, showField, scope, canEditStatus, canAdminResetPassword };
}
