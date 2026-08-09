"use client";

import { useCallback } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext";
import type { StudentFieldGroupKey } from "@/shared/constants/profile-field-groups";
import { studentFieldGroupGraphqlPermission } from "@/shared/lib/field-group-permission-key";

const isAppPermission = (value: string): value is AppPermission =>
  (Object.values(AppPermission) as readonly string[]).includes(value);

export type UseStudentFieldAccessOptions = {
  /**
   * Optional override for whether the actor is viewing their own student profile.
   * Defaults to the server-driven `isOwnStudentProfile` flag from
   * `StudentProfileContext`.
   */
  readonly isOwnStudentProfileOverride?: boolean;
};

export function useStudentFieldAccess(options: UseStudentFieldAccessOptions = {}) {
  const hasPermission = useUserStore(state => state.hasPermission);
  const profileContext = useStudentProfileContext();

  const isOwnStudentProfile =
    options.isOwnStudentProfileOverride ?? profileContext?.profile?.isOwnStudentProfile ?? false;

  const canView = useCallback(
    (groupKey: StudentFieldGroupKey): boolean => {
      const action = isOwnStudentProfile ? "view_own" : "view_other";
      const permStr = studentFieldGroupGraphqlPermission(groupKey, action);
      return isAppPermission(permStr) ? hasPermission(permStr) : false;
    },
    [hasPermission, isOwnStudentProfile]
  );

  const canEdit = useCallback(
    (groupKey: StudentFieldGroupKey): boolean => {
      const action = isOwnStudentProfile ? "edit_own" : "edit_other";
      const permStr = studentFieldGroupGraphqlPermission(groupKey, action);
      return isAppPermission(permStr) ? hasPermission(permStr) : false;
    },
    [hasPermission, isOwnStudentProfile]
  );

  const canViewField = useCallback((groupKey: StudentFieldGroupKey): boolean => canView(groupKey), [canView]);

  const showField = useCallback(
    (_value: unknown, groupKey: StudentFieldGroupKey): boolean => canViewField(groupKey),
    [canViewField]
  );

  return { canView, canEdit, canViewField, showField };
}
