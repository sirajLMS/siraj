"use client";

import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { AdminDashboardContainer } from "@/frontend/views/dashboard/admin/home/AdminDashboardContainer";
import { ParentDashboardContainer } from "@/frontend/views/dashboard/parent/dashboard/ParentDashboardContainer";
import { TeacherDashboardContainer } from "@/frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer";

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

export function DashboardContainer() {
  const { user, setUser } = useUserStore();
  const t = useTranslations("common");

  const { data, loading } = useQuery(meQueryDocument, {
    skip: !!user?.role,
  });

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
    }
  }, [data, setUser]);

  if (!user && loading) {
    return <div>{t("loading")}</div>;
  }

  const permissions = user?.permissions || [];

  if (shouldShowParentDashboard(permissions)) {
    return <ParentDashboardContainer />;
  }

  if (shouldShowTeacherDashboard(permissions)) {
    return <TeacherDashboardContainer />;
  }

  return <AdminDashboardContainer />;
}
