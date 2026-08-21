"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StaffProfileView } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileView";
import { ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";

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
    scope: ProfileScope.OWN,
    mode: ProfileMode.VIEW,
    targetUserId: "user-staff-1",
  },
};

export const AdminView: Story = {
  args: {
    scope: ProfileScope.OTHER,
    mode: ProfileMode.VIEW,
    targetUserId: "user-staff-1",
  },
};

export const EditOwnView: Story = {
  args: {
    scope: ProfileScope.OWN,
    mode: ProfileMode.EDIT,
    targetUserId: "user-staff-1",
  },
};

export const EditAdminView: Story = {
  args: {
    scope: ProfileScope.OTHER,
    mode: ProfileMode.EDIT,
    targetUserId: "user-staff-1",
  },
};
