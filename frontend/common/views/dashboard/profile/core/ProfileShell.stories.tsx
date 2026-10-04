"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ProfileShell } from "@/frontend/common/views/dashboard/profile/core/ProfileShell";
import {
  MockProfileActions,
  MockProfileChildren,
  StorybookPageFrame,
  TabbedShellStory,
} from "@/frontend/common/views/dashboard/profile/core/ProfileShell.fixtures";
import { ProfileAudience, ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";

const meta: Meta<typeof ProfileShell> = {
  title: "Views/profile/core/ProfileShell",
  component: ProfileShell,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      useUserStore.setState({
        user: null,
        name: "",
        role: "teacher",
        avatarUrl: "",
        permissions: [],
        notificationCount: 0,
        actorIsSuperAdmin: false,
      });
      return (
        <StorybookPageFrame>
          <Story />
        </StorybookPageFrame>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ProfileShell>;

export const Default: Story = {
  render: args => <TabbedShellStory {...args} />,
  args: {
    name: "John Doe",
    email: "john.doe@example.com",
    roleLabel: "Teacher",
    audience: ProfileAudience.TEACHER,
    scope: ProfileScope.OWN,
    mode: ProfileMode.VIEW,
    currentTab: "profile",
    actions: <MockProfileActions />,
    children: <MockProfileChildren />,
  },
};

export const ParentProfile: Story = {
  render: args => <TabbedShellStory {...args} />,
  args: {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    roleLabel: "Parent",
    audience: ProfileAudience.PARENT,
    scope: ProfileScope.OWN,
    mode: ProfileMode.VIEW,
    currentTab: "profile",
    actions: <MockProfileActions />,
    children: <MockProfileChildren />,
  },
  decorators: [
    Story => {
      useUserStore.setState({ role: "parent" });
      return <Story />;
    },
  ],
};

export const StaffProfile: Story = {
  render: args => <TabbedShellStory {...args} />,
  args: {
    name: "Admin User",
    email: "admin@example.com",
    roleLabel: "Academy Admin",
    audience: ProfileAudience.STAFF,
    scope: ProfileScope.OWN,
    mode: ProfileMode.VIEW,
    currentTab: "profile",
    actions: <MockProfileActions />,
    children: <MockProfileChildren />,
  },
  decorators: [
    Story => {
      useUserStore.setState({ role: "staff" });
      return <Story />;
    },
  ],
};

export const LoadingState: Story = {
  args: {
    loading: true,
    audience: ProfileAudience.TEACHER,
    scope: ProfileScope.OWN,
  },
};

export const ErrorState: Story = {
  args: {
    error: "Failed to load profile. Please try again later.",
    audience: ProfileAudience.TEACHER,
    scope: ProfileScope.OWN,
    onRetry: () => {},
  },
};

export const OtherUserProfile: Story = {
  render: args => <TabbedShellStory {...args} />,
  args: {
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    roleLabel: "Teacher",
    audience: ProfileAudience.TEACHER,
    scope: ProfileScope.OTHER,
    mode: ProfileMode.VIEW,
    currentTab: "profile",
    actions: <MockProfileActions />,
    children: <MockProfileChildren />,
  },
};
