"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { AdminDashboardContainer } from "@/frontend/common/views/dashboard/admin/home/AdminDashboardContainer";
import { ParentDashboardContainer } from "@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer";
import { StudentDashboardContainer } from "@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer";
import { SupervisorDashboardContainer } from "@/frontend/common/views/dashboard/supervisor/dashboard/SupervisorDashboardContainer";
import { TeacherDashboardContainer } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer";
import { useAppTranslation } from "@/shared/locale/client";

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

export function DashboardContainer() {
  const { user, setUser } = useUserStore();
  const t = useAppTranslation().commonTranslations;

  const { data, loading } = useQuery(meQueryDocument, {
    skip: !!user?.role,
  });

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
    }
  }, [data, setUser]);

  if (!user && loading) {
    return <div>{t.loading}</div>;
  }

  const permissions = user?.permissions || [];

  if (shouldShowParentDashboard(permissions)) {
    return <ParentDashboardContainer />;
  }

  if (shouldShowTeacherDashboard(permissions)) {
    return <TeacherDashboardContainer />;
  }

  if (shouldShowStudentDashboard(permissions)) {
    return <StudentDashboardContainer />;
  }

  if (shouldShowSupervisorDashboard(permissions)) {
    return <SupervisorDashboardContainer />;
  }

  return <AdminDashboardContainer />;
}
