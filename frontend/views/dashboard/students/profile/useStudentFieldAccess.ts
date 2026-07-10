"use client";

import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { useStudentProfileContext } from "@/frontend/views/dashboard/students/profile/StudentProfileContext";
import type { StudentFieldGroupKey } from "@/shared/constants/profile-field-groups";
import { studentFieldGroupGraphqlPermission } from "@/shared/lib/field-group-permission-key";

const LEGACY_VIEW_GROUPS: Partial<Record<StudentFieldGroupKey, AppPermission>> = {
  student_history: AppPermission.HistoryViewCalendar,
  student_quota_edit: AppPermission.StudentEditQuota,
};

export function useStudentFieldAccess() {
  const hasPermission = useUserStore(state => state.hasPermission);
  const profileContext = useStudentProfileContext();
  const isAssociatedViewer = profileContext?.profile?.isAssociatedViewer ?? false;

  const resolvePermission = (
    groupKey: StudentFieldGroupKey,
    action: "view_own" | "view_other" | "edit_own" | "edit_other"
  ): AppPermission => studentFieldGroupGraphqlPermission(groupKey, action) as AppPermission;

  const hasLegacyView = (groupKey: StudentFieldGroupKey): boolean => {
    const legacyPermission = LEGACY_VIEW_GROUPS[groupKey];
    return legacyPermission != null && hasPermission(legacyPermission);
  };

  const canView = (groupKey: StudentFieldGroupKey): boolean => {
    const action = isAssociatedViewer ? "view_own" : "view_other";
    if (hasPermission(resolvePermission(groupKey, action))) {
      return true;
    }
    return hasLegacyView(groupKey);
  };

  const canEdit = (groupKey: StudentFieldGroupKey): boolean => {
    const action = isAssociatedViewer ? "edit_own" : "edit_other";
    if (hasPermission(resolvePermission(groupKey, action))) {
      return true;
    }
    return groupKey === "student_quota_edit" && hasPermission(AppPermission.StudentEditQuota);
  };

  const showField = (value: unknown, groupKey: StudentFieldGroupKey): boolean => {
    if (!canView(groupKey)) {
      return false;
    }
    return value != null;
  };

  return { canView, canEdit, showField };
}
