"use client";

import { Box, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { AccountStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { StaffProfileView } from "@/frontend/views/dashboard/profile/staff/StaffProfileView";

const staffProfile = {
  id: "user-staff-1",
  staffProfileId: "staff-profile-1",
  name: "Robert Staff",
  email: "robert.s@educore.edu",
  avatarUrl: null,
  phone: "+1 (555) 123-4567",
  status: AccountStatus.Activated,
  roleSlug: "senior-admin",
  roleName: "Senior Administrator",
};

type StaffProfileViewStoryProps = ComponentProps<typeof StaffProfileView> & {
  readonly loading?: boolean;
  readonly hasError?: boolean;
};

function StaffProfileViewStory({ loading, hasError, ...viewProps }: StaffProfileViewStoryProps) {
  const tc = useTranslations("profile");

  if (loading) {
    return <Typography sx={{ color: theme => theme.palette.text.secondary }}>{tc("shell.loading")}</Typography>;
  }

  if (hasError) {
    return (
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.error.main }}>
        {tc("errors.failedToLoad")}
      </Typography>
    );
  }

  return <StaffProfileView {...viewProps} />;
}

const meta: Meta<typeof StaffProfileViewStory> = {
  title: "Views/profile/staff",
  component: StaffProfileViewStory,
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
type Story = StoryObj<typeof StaffProfileViewStory>;

export const Default: Story = {
  args: {
    staffData: staffProfile,
    isAdminScope: false,
    loading: false,
    hasError: false,
  },
};

export const AdminView: Story = {
  args: {
    staffData: staffProfile,
    isAdminScope: true,
    loading: false,
    hasError: false,
  },
};

export const Loading: Story = {
  args: {
    staffData: staffProfile,
    isAdminScope: false,
    loading: true,
    hasError: false,
  },
};

export const ErrorState: Story = {
  args: {
    staffData: staffProfile,
    isAdminScope: false,
    loading: false,
    hasError: true,
  },
};
