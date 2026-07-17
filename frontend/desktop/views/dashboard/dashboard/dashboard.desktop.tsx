"use client";

import { AdminDashboardContainer } from "@/frontend/common/views/dashboard/admin/home/AdminDashboardContainer";
import type { DashboardContainerViewModel } from "@/frontend/common/views/dashboard/dashboard/useDashboardContainerViewModel";
import { ParentDashboardContainer } from "@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer";
import { StudentDashboardContainer } from "@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer";
import { SupervisorDashboardContainer } from "@/frontend/common/views/dashboard/supervisor/dashboard/SupervisorDashboardContainer";
import { TeacherDashboardContainer } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page/DesktopPageContainer";

export function DashboardDesktopView({ role, loading }: Readonly<DashboardContainerViewModel>) {
  if (loading) {
    return <DesktopPageContainer>Loading...</DesktopPageContainer>;
  }

  switch (role) {
    case "parent":
      return <ParentDashboardContainer />;
    case "teacher":
      return <TeacherDashboardContainer />;
    case "student":
      return <StudentDashboardContainer />;
    case "supervisor":
      return <SupervisorDashboardContainer />;
    default:
      return <AdminDashboardContainer />;
  }
}
