"use client";

import { Box, Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { useUserStore } from "@/frontend/stores/userStore";
import { ProfileShell } from "./ProfileShell";

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
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ProfileShell>;

const mockActions = (
  <Box sx={{ display: "flex", gap: 1 }}>
    <Button variant="contained" size="small">
      Edit
    </Button>
  </Box>
);

const mockChildren = (
  <Box sx={{ p: 2 }}>
    <Box
      sx={theme => ({
        bgcolor: theme.palette.background.paper,
        p: 2,
        borderRadius: 1,
        mb: 2,
      })}
    >
      <h3>Profile Content</h3>
      <p>This section represents dynamic content rendered based on the selected tab.</p>
    </Box>
  </Box>
);

function TabbedShellStory(args: ComponentProps<typeof ProfileShell>) {
  const [currentTab, setCurrentTab] = useState(args.currentTab ?? "profile");
  return <ProfileShell {...args} currentTab={currentTab} onTabChange={setCurrentTab} />;
}

export const Default: Story = {
  render: args => <TabbedShellStory {...args} />,
  args: {
    title: "User Profile",
    subtitle: "Manage your account details",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "teacher",
    audience: "teacher",
    scope: "own",
    mode: "view",
    currentTab: "profile",
    actions: mockActions,
    children: mockChildren,
  },
};

export const ParentProfile: Story = {
  render: args => <TabbedShellStory {...args} />,
  args: {
    title: "Parent Profile",
    subtitle: "View and manage child accounts",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "parent",
    audience: "parent",
    scope: "own",
    mode: "view",
    currentTab: "profile",
    actions: mockActions,
    children: mockChildren,
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
    title: "Staff Profile",
    subtitle: "Administrative view",
    name: "Admin User",
    email: "admin@example.com",
    role: "staff",
    audience: "staff",
    scope: "own",
    mode: "view",
    currentTab: "profile",
    actions: mockActions,
    children: mockChildren,
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
    title: "User Profile",
    subtitle: "Loading...",
    loading: true,
    audience: "teacher",
    scope: "own",
  },
};

export const ErrorState: Story = {
  args: {
    title: "User Profile",
    error: "Failed to load profile. Please try again later.",
    audience: "teacher",
    scope: "own",
    onRetry: () => {},
  },
};

export const OtherUserProfile: Story = {
  render: args => <TabbedShellStory {...args} />,
  args: {
    title: "Viewing User",
    subtitle: "Profile of another user",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    role: "teacher",
    audience: "teacher",
    scope: "other",
    mode: "view",
    currentTab: "profile",
    actions: mockActions,
    children: mockChildren,
  },
};
