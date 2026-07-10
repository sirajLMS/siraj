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

const LEGACY_EDIT_GROUPS: Partial<Record<StudentFieldGroupKey, AppPermission>> = {
  student_academic: AppPermission.StudentManageStatus,
  student_quota_edit: AppPermission.StudentEditQuota,
};

export type UseStudentFieldAccessOptions = {
  /**
   * Optional override to force the viewer-scope verdict used by the hook.
   * Defaults to the server-driven `isAssociatedViewer` flag from
   * `StudentProfileContext`. Use this only in standalone views where the
   * unified profile context is unavailable (e.g., the legacy standalone
   * quota edit route): pass the server-supplied association verdict, or
   * true when the legacy `STUDENT_VIEW_ASSOCIATED` permission is granted
   * and the caller knows the student is associated to the actor.
   */
  readonly isAssociatedViewerOverride?: boolean;
};

export function useStudentFieldAccess(options: UseStudentFieldAccessOptions = {}) {
  const hasPermission = useUserStore(state => state.hasPermission);
  const profileContext = useStudentProfileContext();

  const isAssociatedViewer =
    options.isAssociatedViewerOverride ??
    profileContext?.profile?.isAssociatedViewer ??
    (profileContext == null && hasPermission(AppPermission.StudentViewAssociated));

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

  const hasLegacyEdit = (groupKey: StudentFieldGroupKey): boolean => {
    const legacyPermission = LEGACY_EDIT_GROUPS[groupKey];
    return legacyPermission != null && hasPermission(legacyPermission);
  };

  const canEdit = (groupKey: StudentFieldGroupKey): boolean => {
    const action = isAssociatedViewer ? "edit_own" : "edit_other";
    if (hasPermission(resolvePermission(groupKey, action))) {
      return true;
    }
    return hasLegacyEdit(groupKey);
  };

  const showField = (value: unknown, groupKey: StudentFieldGroupKey): boolean => {
    if (!canView(groupKey)) {
      return false;
    }
    return value != null;
  };

  return { canView, canEdit, showField };
}
