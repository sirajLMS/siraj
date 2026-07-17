"use client";

import { AdminDashboardContainer } from "@/frontend/common/views/dashboard/admin/home/AdminDashboardContainer";
import type { DashboardContainerViewModel } from "@/frontend/common/views/dashboard/dashboard/useDashboardContainerViewModel";
import { ParentDashboardContainer } from "@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer";
import { StudentDashboardContainer } from "@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer";
import { SupervisorDashboardContainer } from "@/frontend/common/views/dashboard/supervisor/dashboard/SupervisorDashboardContainer";
import { TeacherDashboardContainer } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";

export function DashboardMobileView({ role, loading }: Readonly<DashboardContainerViewModel>) {
  if (loading) {
    return <MobilePageContainer>Loading...</MobilePageContainer>;
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
