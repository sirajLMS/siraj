"use client";

import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { useStudentProfileContext } from "@/frontend/views/dashboard/students/profile/StudentProfileContext";
import { type StudentFieldGroupKey, studentFieldPermissionKey } from "@/shared/constants/profile-field-groups";

export function useStudentFieldAccess() {
  const hasPermission = useUserStore(state => state.hasPermission);
  const profileContext = useStudentProfileContext();
  const isAssociatedViewer = profileContext?.profile != null;

  const resolvePermission = (
    groupKey: StudentFieldGroupKey,
    action: "view_own" | "view_other" | "edit_own" | "edit_other"
  ) => studentFieldPermissionKey(groupKey, action) as AppPermission;

  const canView = (groupKey: StudentFieldGroupKey): boolean => {
    const action = isAssociatedViewer ? "view_own" : "view_other";
    return hasPermission(resolvePermission(groupKey, action));
  };

  const canEdit = (groupKey: StudentFieldGroupKey): boolean => {
    const action = isAssociatedViewer ? "edit_own" : "edit_other";
    return hasPermission(resolvePermission(groupKey, action));
  };

  const showField = (value: unknown, groupKey: StudentFieldGroupKey): boolean => {
    if (!canView(groupKey)) {
      return false;
    }
    return value != null;
  };

  return { canView, canEdit, showField };
}
