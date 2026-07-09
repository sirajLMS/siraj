"use client";

import { Box, Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { ProfileAudience, ProfileMode, ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { ProfileShell } from "./ProfileShell";

function StorybookPageFrame({ children }: { readonly children: ReactNode }) {
  return (
    <Box
      sx={theme => ({
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        px: { xs: 0, md: theme.layout.pageMargin },
        py: { xs: theme.spacing(2), md: theme.layout.pageMargin },
      })}
    >
      {children}
    </Box>
  );
}

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
    name: "John Doe",
    email: "john.doe@example.com",
    roleLabel: "Teacher",
    audience: ProfileAudience.Teacher,
    scope: ProfileScope.Own,
    mode: ProfileMode.View,
    currentTab: "profile",
    actions: mockActions,
    children: mockChildren,
  },
};

export const ParentProfile: Story = {
  render: args => <TabbedShellStory {...args} />,
  args: {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    roleLabel: "Parent",
    audience: ProfileAudience.Parent,
    scope: ProfileScope.Own,
    mode: ProfileMode.View,
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
    name: "Admin User",
    email: "admin@example.com",
    roleLabel: "Academy Admin",
    audience: ProfileAudience.Staff,
    scope: ProfileScope.Own,
    mode: ProfileMode.View,
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
    loading: true,
    audience: ProfileAudience.Teacher,
    scope: ProfileScope.Own,
  },
};

export const ErrorState: Story = {
  args: {
    error: "Failed to load profile. Please try again later.",
    audience: ProfileAudience.Teacher,
    scope: ProfileScope.Own,
    onRetry: () => {},
  },
};

export const OtherUserProfile: Story = {
  render: args => <TabbedShellStory {...args} />,
  args: {
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    roleLabel: "Teacher",
    audience: ProfileAudience.Teacher,
    scope: ProfileScope.Other,
    mode: ProfileMode.View,
    currentTab: "profile",
    actions: mockActions,
    children: mockChildren,
  },
};
