"use client";

import { type AppPermission, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";
import { profileFieldGroupGraphqlPermission } from "@/shared/lib/field-group-permission-key";

type UseProfileFieldAccessOptions = {
  readonly scope?: ProfileScope;
};

export function useProfileFieldAccess(options: UseProfileFieldAccessOptions = {}) {
  const hasPermission = useUserStore(state => state.hasPermission);
  const scope = options.scope ?? ProfileScope.Own;

  const resolvePermission = (
    groupKey: ProfileFieldGroupKey,
    action: "view_own" | "view_other" | "edit_own" | "edit_other"
  ): AppPermission => {
    return profileFieldGroupGraphqlPermission(groupKey, action) as AppPermission;
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

  const canViewField = (groupKey: ProfileFieldGroupKey): boolean => canView(groupKey);

  const showField = (_value: unknown, groupKey: ProfileFieldGroupKey): boolean => canViewField(groupKey);

  return { canView, canEdit, canViewField, showField, scope };
}
