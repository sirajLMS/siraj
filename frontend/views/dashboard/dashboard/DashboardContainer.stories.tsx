import type { Meta, StoryObj } from "@storybook/react";
import { useSearchParams } from "next/navigation";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { ParentDashboardContainer } from "@/frontend/views/dashboard/parents/dashboard/ParentDashboardContainer";
import { TeacherDashboardContainer } from "@/frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer";
import { shouldRenderTeacherDashboard } from "@/frontend/views/dashboard/teachers/dashboard/utils/teacherDashboardMode";
import { MockAdminDashboardContainer } from "../admin/dashboard/AdminDashboardContainer.stories";

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
    permissions.includes(AppPermission.ScheduleViewAssigned) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function MockDashboardContainer() {
  const permissions = useUserStore(state => state.permissions);
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
