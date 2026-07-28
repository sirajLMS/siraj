import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { seedPermissions } from "@/frontend/common/stories";
import { ReportsContainer } from "@/frontend/common/views/dashboard/reports/ReportsContainer";

const meta = {
  title: "Views/dashboard/reports/ReportsContainer",
  component: ReportsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ReportsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminFullAccess: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.ReportGenerateCustom, AppPermission.ReportViewFinancials]);
      return <Story />;
    },
  ],
};

export const RestrictedAccess: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.ReportGenerateCustom]);
      return <Story />;
    },
  ],
};

export const Loading: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.ReportGenerateCustom, AppPermission.ReportViewFinancials]);
      return <Story />;
    },
  ],
};
