import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UserMenuButton } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton";
import {
  baseMocks,
  impersonatingMocks,
  simulatingMocks,
} from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.stories.fixtures";
import { StoryShell } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.stories.helpers";

const meta: Meta<typeof UserMenuButton> = {
  title: "Dashboard/UserMenuButton",
  component: UserMenuButton,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof UserMenuButton>;

export const IdleSuperAdmin: Story = {
  render: () => (
    <StoryShell mocks={baseMocks}>
      <UserMenuButton userName="Super Admin" userEmail="admin@example.com" avatarUrl="" />
    </StoryShell>
  ),
};

export const Impersonating: Story = {
  render: () => (
    <StoryShell mocks={impersonatingMocks}>
      <UserMenuButton userName="Teacher User" userEmail="teacher@example.com" avatarUrl="" />
    </StoryShell>
  ),
};

export const SimulatingGroup: Story = {
  render: () => (
    <StoryShell mocks={simulatingMocks}>
      <UserMenuButton userName="Super Admin" userEmail="admin@example.com" avatarUrl="" />
    </StoryShell>
  ),
};
