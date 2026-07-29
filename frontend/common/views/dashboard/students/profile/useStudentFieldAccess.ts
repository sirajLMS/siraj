"use client";

import { useCallback } from "react";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext";
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

  const isAssociatedViewer = options.isAssociatedViewerOverride ?? profileContext?.profile?.isAssociatedViewer ?? false;

  const canView = useCallback(
    (groupKey: StudentFieldGroupKey): boolean => {
      const action = isAssociatedViewer ? "view_own" : "view_other";
      return hasPermission(studentFieldGroupGraphqlPermission(groupKey, action) as AppPermission);
    },
    [hasPermission, isAssociatedViewer]
  );

  const canEdit = useCallback(
    (groupKey: StudentFieldGroupKey): boolean => {
      const action = isAssociatedViewer ? "edit_own" : "edit_other";
      return hasPermission(studentFieldGroupGraphqlPermission(groupKey, action) as AppPermission);
    },
    [hasPermission, isAssociatedViewer]
  );

  const canViewField = useCallback((groupKey: StudentFieldGroupKey): boolean => canView(groupKey), [canView]);

  const showField = useCallback(
    (_value: unknown, groupKey: StudentFieldGroupKey): boolean => canViewField(groupKey),
    [canViewField]
  );

  return { canView, canEdit, canViewField, showField };
}
