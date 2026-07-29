"use client";

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { StudentFieldGroupKey } from "@/shared/constants/profile-field-groups";
import { studentFieldGroupGraphqlPermission } from "@/shared/lib/field-group-permission-key";

export type UseStudentFieldAccessOptions = {
  /**
   * Optional override to force the viewer-scope verdict used by the hook.
   * Defaults to the server-driven `isAssociatedViewer` flag from
   * `StudentProfileContext`.
   */
  readonly isAssociatedViewerOverride?: boolean;
};

export function useStudentFieldAccess(options: UseStudentFieldAccessOptions = {}) {
  const hasPermission = useUserStore(state => state.hasPermission);
  const profileContext = useStudentProfileContext();

  const isAssociatedViewer =
    options.isAssociatedViewerOverride ?? profileContext?.profile?.isAssociatedViewer ?? false;

  const resolvePermission = (
    groupKey: StudentFieldGroupKey,
    action: "view_own" | "view_other" | "edit_own" | "edit_other"
  ): AppPermission => studentFieldGroupGraphqlPermission(groupKey, action) as AppPermission;

  const canView = (groupKey: StudentFieldGroupKey): boolean => {
    const action = isAssociatedViewer ? "view_own" : "view_other";
    return hasPermission(resolvePermission(groupKey, action));
  };

  const canEdit = (groupKey: StudentFieldGroupKey): boolean => {
    const action = isAssociatedViewer ? "edit_own" : "edit_other";
    return hasPermission(resolvePermission(groupKey, action));
  };

  const canViewField = (groupKey: StudentFieldGroupKey): boolean => canView(groupKey);

  const showField = (_value: unknown, groupKey: StudentFieldGroupKey): boolean => canViewField(groupKey);

  return { canView, canEdit, canViewField, showField };
}
