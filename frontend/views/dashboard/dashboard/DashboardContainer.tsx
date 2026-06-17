"use client";

import { useSearchParams } from "next/navigation";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { ParentDashboardContainer } from "@/frontend/views/dashboard/parents/dashboard/ParentDashboardContainer";
import { TeacherDashboardContainer } from "@/frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer";
import { shouldRenderTeacherDashboard } from "@/frontend/views/dashboard/teachers/dashboard/utils/teacherDashboardMode";
import { AdminDashboardContainer } from "./AdminDashboardContainer";

function shouldShowParentDashboard(permissions: readonly string[]): boolean {
  return permissions.includes("parent-dashboard") && !permissions.includes("home");
}

function shouldShowTeacherDashboard(permissions: readonly string[], modeParam: string | null): boolean {
  if (shouldRenderTeacherDashboard(permissions, modeParam)) {
    return true;
  }
  return permissions.includes("teacher-dashboard") && !permissions.includes("home");
}

export function DashboardContainer() {
  const permissions = useUserStore(state => state.permissions);
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");

  if (shouldShowParentDashboard(permissions)) {
    return <ParentDashboardContainer />;
  }

  if (shouldShowTeacherDashboard(permissions, modeParam)) {
    return <TeacherDashboardContainer />;
  }

  return <AdminDashboardContainer />;
}
