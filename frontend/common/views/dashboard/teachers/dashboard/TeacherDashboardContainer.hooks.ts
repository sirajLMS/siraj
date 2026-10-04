"use client";

import { useEffect } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";

export interface TeacherDashboardSessionPermissions {
  readonly hasSessionUpdateStatusStart: boolean;
  readonly hasSessionUpdateStatusAbsent: boolean;
  readonly hasSessionUpdateStatusLeave: boolean;
  readonly hasSessionActivateClass: boolean;
}

/**
 * Computes the session-management permission booleans from the user store and
 * mirrors them into the teacher-dashboard store so per-feature islands and
 * tier views can read them without touching the user store again.
 */
export function useTeacherDashboardSessionPermissions(): TeacherDashboardSessionPermissions {
  const permissions = useUserStore(state => state.permissions);
  const setSessionPermissionBooleans = useTeacherDashboardStore(state => state.setSessionPermissionBooleans);

  const hasSessionUpdateStatusStart = permissions.includes(AppPermission.SessionUpdateStatusStart);
  const hasSessionUpdateStatusAbsent = permissions.includes(AppPermission.SessionUpdateStatusAbsent);
  const hasSessionUpdateStatusLeave = permissions.includes(AppPermission.SessionUpdateStatusLeave);
  const hasSessionActivateClass = permissions.includes(AppPermission.SessionActivateClass);

  useEffect(() => {
    setSessionPermissionBooleans({
      hasSessionUpdateStatusStart,
      hasSessionUpdateStatusAbsent,
      hasSessionUpdateStatusLeave,
      hasSessionActivateClass,
    });
  }, [
    hasSessionUpdateStatusStart,
    hasSessionUpdateStatusAbsent,
    hasSessionUpdateStatusLeave,
    hasSessionActivateClass,
    setSessionPermissionBooleans,
  ]);

  return {
    hasSessionUpdateStatusStart,
    hasSessionUpdateStatusAbsent,
    hasSessionUpdateStatusLeave,
    hasSessionActivateClass,
  };
}
