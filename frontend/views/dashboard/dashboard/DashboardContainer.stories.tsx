import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { TeacherDashboardContainer } from "@/frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer";
import { MockAdminDashboardContainer } from "../admin/dashboard/AdminDashboardContainer.stories";
import { ParentDashboardContainer } from "../parent/dashboard/ParentDashboardContainer";

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

export function MockDashboardContainer() {
  const permissions = useUserStore(state => state.permissions);

  if (shouldShowParentDashboard(permissions)) {
    return <ParentDashboardContainer />;
  }

  if (shouldShowTeacherDashboard(permissions)) {
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
