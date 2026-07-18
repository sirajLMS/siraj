import type { Meta, StoryObj } from "@storybook/react";
import { AccountStatus, AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ClassDetailsContainer } from "@/frontend/common/views/dashboard/classes/details/ClassDetailsContainer";

function seedPermissions(perms: AppPermission[]) {
  useUserStore.setState({
    permissions: perms,
    user: {
      id: "mock-id",
      name: "Mock User",
      role: "Mock Role",
      avatarUrl: "",
      permissions: perms,
      notificationCount: 0,
      teacherId: null,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
      email: "mock@example.com",
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
      __typename: "User",
    },
  });
}

const meta = {
  title: "Views/dashboard/classes/details/ClassDetailsContainer",
  component: ClassDetailsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ClassDetailsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.SessionViewDetails]);
      return <Story />;
    },
  ],
};

export const ForceActivateEnabled: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.SessionOverrideActions]);
      return <Story />;
    },
  ],
};

export const ForceActivateDisabled: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.SessionViewDetails]);
      return <Story />;
    },
  ],
};
