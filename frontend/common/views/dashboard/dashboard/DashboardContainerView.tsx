"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { DashboardRoleSkeleton } from "@/frontend/common/views/dashboard/dashboard/DashboardRoleSkeleton";
import type { DashboardContainerViewModel } from "@/frontend/common/views/dashboard/dashboard/useDashboardContainerViewModel";

const LazyParentDashboardContainer = dynamic(
  () =>
    import("@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer").then(m => ({
      default: m.ParentDashboardContainer,
    })),
  { ssr: true }
);

const LazyTeacherDashboardContainer = dynamic(
  () =>
    import("@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer").then(m => ({
      default: m.TeacherDashboardContainer,
    })),
  { ssr: true }
);

const LazyStudentDashboardContainer = dynamic(
  () =>
    import("@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer").then(m => ({
      default: m.StudentDashboardContainer,
    })),
  { ssr: true }
);

const LazySupervisorDashboardContainer = dynamic(
  () =>
    import("@/frontend/common/views/dashboard/supervisor/dashboard/SupervisorDashboardContainer").then(m => ({
      default: m.SupervisorDashboardContainer,
    })),
  { ssr: true }
);

const LazyAdminDashboardContainer = dynamic(
  () =>
    import("@/frontend/common/views/dashboard/admin/home/AdminDashboardContainer").then(m => ({
      default: m.AdminDashboardContainer,
    })),
  { ssr: true }
);

/**
 * Role dispatch for the dashboard body. Each role-specific container is lazy-loaded
 * and wrapped in `<Suspense fallback={<DashboardRoleSkeleton />} />`.
 */
export function DashboardContainerView(viewModel: Readonly<DashboardContainerViewModel>) {
  switch (viewModel.role) {
    case "parent":
      return (
        <Suspense fallback={<DashboardRoleSkeleton />}>
          <LazyParentDashboardContainer />
        </Suspense>
      );
    case "teacher":
      return (
        <Suspense fallback={<DashboardRoleSkeleton />}>
          <LazyTeacherDashboardContainer />
        </Suspense>
      );
    case "student":
      return (
        <Suspense fallback={<DashboardRoleSkeleton />}>
          <LazyStudentDashboardContainer />
        </Suspense>
      );
    case "supervisor":
      return (
        <Suspense fallback={<DashboardRoleSkeleton />}>
          <LazySupervisorDashboardContainer />
        </Suspense>
      );
    default:
      return (
        <Suspense fallback={<DashboardRoleSkeleton />}>
          <LazyAdminDashboardContainer />
        </Suspense>
      );
  }
}
