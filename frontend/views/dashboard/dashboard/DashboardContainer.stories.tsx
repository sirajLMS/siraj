import type { Meta, StoryObj } from "@storybook/react";
import { useSearchParams } from "next/navigation";
import { useUserStore as useMockUserStore } from "@/frontend/stores/mockUserStore";
import { ParentDashboardContainer } from "@/frontend/views/dashboard/parents/dashboard/ParentDashboardContainer";
import { TeacherDashboardContainer } from "@/frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer";
import { shouldRenderTeacherDashboard } from "@/frontend/views/dashboard/teachers/dashboard/utils/teacherDashboardMode";
import { MockAdminDashboardContainer } from "./AdminDashboardContainer.stories";

function shouldShowParentDashboard(permissions: readonly string[]): boolean {
  return permissions.includes("parent-dashboard") && !permissions.includes("home");
}

function shouldShowTeacherDashboard(permissions: readonly string[], modeParam: string | null): boolean {
  if (shouldRenderTeacherDashboard(permissions, modeParam)) {
    return true;
  }
  return permissions.includes("teacher-dashboard") && !permissions.includes("home");
}

export function MockDashboardContainer() {
  const permissions = useMockUserStore(state => state.permissions);
  const searchParams = useSearchParams();
  const modeParam = searchParams?.get("mode") ?? null;

  if (shouldShowParentDashboard(permissions)) {
    return <ParentDashboardContainer />;
  }

  if (shouldShowTeacherDashboard(permissions, modeParam)) {
    return <TeacherDashboardContainer />;
  }

  return <MockAdminDashboardContainer />;
}

const meta: Meta<typeof MockDashboardContainer> = {
  title: "Views/dashboard/dashboard/DashboardContainer",
  component: MockDashboardContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockDashboardContainer>;

export const Default: Story = {
  args: {},
};
