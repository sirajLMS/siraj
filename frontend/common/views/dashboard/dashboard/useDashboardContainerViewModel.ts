"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";

function shouldShowParentDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.ScheduleViewFamily) && !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

function shouldShowTeacherDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.TeacherViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

function shouldShowStudentDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.StudentViewOwnDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

function shouldShowSupervisorDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.SupervisorViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export type DashboardRole = "parent" | "teacher" | "student" | "supervisor" | "admin";

export interface DashboardContainerViewModel {
  readonly role: DashboardRole;
  readonly userName: string;
  readonly loading: boolean;
}

export interface UseDashboardContainerViewModelProps {
  readonly onRetry?: () => void;
}

export function useDashboardContainerViewModel(
  _props: Readonly<UseDashboardContainerViewModelProps>
): DashboardContainerViewModel {
  const { user, setUser } = useUserStore();

  const { data, loading } = useQuery(meQueryDocument, {
    skip: !!user?.role,
  });

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
    }
  }, [data, setUser]);

  const permissions = user?.permissions || [];
  const userName = user?.name || "";

  let role: DashboardRole = "admin";

  if (shouldShowParentDashboard(permissions)) {
    role = "parent";
  } else if (shouldShowTeacherDashboard(permissions)) {
    role = "teacher";
  } else if (shouldShowStudentDashboard(permissions)) {
    role = "student";
  } else if (shouldShowSupervisorDashboard(permissions)) {
    role = "supervisor";
  }

  return {
    role,
    userName,
    loading: loading && !user,
  };
}
