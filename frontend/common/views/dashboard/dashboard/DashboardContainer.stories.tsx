import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { MockAdminDashboardContainer } from "@/frontend/common/views/dashboard/admin/home/AdminDashboardContainer.stories";
import { ParentDashboardContainer } from "@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer";
import { TeacherDashboardContainer } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer";

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
