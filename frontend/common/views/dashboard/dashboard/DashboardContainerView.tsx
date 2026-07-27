"use client";

import { Suspense } from "react";
import { AdminDashboardContainer } from "@/frontend/common/views/dashboard/admin/home/AdminDashboardContainer";
import { DashboardRoleSkeleton } from "@/frontend/common/views/dashboard/dashboard/DashboardRoleSkeleton";
import type { DashboardContainerViewModel } from "@/frontend/common/views/dashboard/dashboard/useDashboardContainerViewModel";
import { ParentDashboardContainer } from "@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer";
import { StudentDashboardContainer } from "@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer";
import { SupervisorDashboardContainer } from "@/frontend/common/views/dashboard/supervisor/dashboard/SupervisorDashboardContainer";
import { TeacherDashboardContainer } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer";

/**
 * Role dispatch for the dashboard body. Each role-specific container is wrapped
 * in `<Suspense fallback={<DashboardRoleSkeleton />} />` so the layout chrome
 * paints first and the role body streams in without layout shift — the
 * skeleton reserves the metric grid + content body proportions.
 */
export function DashboardContainerView(viewModel: Readonly<DashboardContainerViewModel>) {
  switch (viewModel.role) {
    case "parent":
      return (
        <Suspense fallback={<DashboardRoleSkeleton />}>
          <ParentDashboardContainer />
        </Suspense>
      );
    case "teacher":
      return (
        <Suspense fallback={<DashboardRoleSkeleton />}>
          <TeacherDashboardContainer />
        </Suspense>
      );
    case "student":
      return (
        <Suspense fallback={<DashboardRoleSkeleton />}>
          <StudentDashboardContainer />
        </Suspense>
      );
    case "supervisor":
      return (
        <Suspense fallback={<DashboardRoleSkeleton />}>
          <SupervisorDashboardContainer />
        </Suspense>
      );
    default:
      return (
        <Suspense fallback={<DashboardRoleSkeleton />}>
          <AdminDashboardContainer />
        </Suspense>
      );
  }
}
