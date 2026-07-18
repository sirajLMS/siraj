"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StaffProfileView } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileView";

const meta: Meta<typeof StaffProfileView> = {
  title: "Views/profile/staff",
  component: StaffProfileView,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 1100, mx: "auto", p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StaffProfileView>;

export const OwnView: Story = {
  args: {
    scope: ProfileScope.Own,
    mode: ProfileMode.View,
    targetUserId: "user-staff-1",
  },
};

export const AdminView: Story = {
  args: {
    scope: ProfileScope.Other,
    mode: ProfileMode.View,
    targetUserId: "user-staff-1",
  },
};

export const EditOwnView: Story = {
  args: {
    scope: ProfileScope.Own,
    mode: ProfileMode.Edit,
    targetUserId: "user-staff-1",
  },
};

export const EditAdminView: Story = {
  args: {
    scope: ProfileScope.Other,
    mode: ProfileMode.Edit,
    targetUserId: "user-staff-1",
  },
};
