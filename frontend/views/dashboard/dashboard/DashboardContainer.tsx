"use client";

import { useQuery } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/graphql/sharedDocuments/auth.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { ParentDashboardContainer } from "@/frontend/views/dashboard/parents/dashboard/ParentDashboardContainer";
import { TeacherDashboardContainer } from "@/frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer";
import { shouldRenderTeacherDashboard } from "@/frontend/views/dashboard/teachers/dashboard/utils/teacherDashboardMode";
import { AdminDashboardContainer } from "./AdminDashboardContainer";

function shouldShowParentDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.ScheduleViewFamily) && !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

function shouldShowTeacherDashboard(permissions: readonly AppPermission[], modeParam: string | null): boolean {
  if (shouldRenderTeacherDashboard(permissions, modeParam)) {
    return true;
  }
  return (
    permissions.includes(AppPermission.TeacherViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function DashboardContainer() {
  const { user, setUser } = useUserStore();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");

  const { data, loading } = useQuery(meQueryDocument, {
    skip: !!user,
  });

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
    }
  }, [data, setUser]);

  if (!user && loading) {
    return <div>Loading...</div>; // Render a loading state while fetching the profile
  }

  const permissions = user?.permissions || [];

  if (shouldShowParentDashboard(permissions)) {
    return <ParentDashboardContainer />;
  }

  if (shouldShowTeacherDashboard(permissions, modeParam)) {
    return <TeacherDashboardContainer />;
  }

  return <AdminDashboardContainer />;
}
