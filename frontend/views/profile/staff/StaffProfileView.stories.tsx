"use client";

import { Box, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { AccountStatus, OverrideState } from "@/frontend/graphql/generated/gql/graphql-types";
import { StaffProfileView } from "./StaffProfileView";

const staffProfile = {
  id: "user-staff-1",
  staffProfileId: "staff-profile-1",
  name: "Robert Staff",
  email: "robert.s@educore.edu",
  avatarUrl: null,
  phone: "+1 (555) 123-4567",
  skypeId: "live:robert.staff_edu",
  status: AccountStatus.Activated,
  roleSlug: "senior-admin",
  roleName: "Senior Administrator",
};

const permissionGroups = [
  {
    id: "group-1",
    name: "User Management",
    slug: "user-management",
    description: "Manage users and profiles",
  },
  {
    id: "group-2",
    name: "Finance Access",
    slug: "finance-access",
    description: "View financial records",
  },
];

const permissionOverrides = [
  {
    id: "perm-1",
    permissionId: "perm-1",
    permissionKey: "billing.view",
    resource: "billing",
    action: "view",
    state: OverrideState.Granted,
  },
];

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
    permissionGroups: null,
    permissionOverrides: null,
    loading: false,
    hasError: false,
  },
};

export const AdminView: Story = {
  args: {
    staffData: staffProfile,
    isAdminScope: true,
    permissionGroups,
    permissionOverrides,
    loading: false,
    hasError: false,
  },
};

export const EmptyPermissions: Story = {
  args: {
    staffData: staffProfile,
    isAdminScope: true,
    permissionGroups: [],
    permissionOverrides: [],
    loading: false,
    hasError: false,
  },
};

export const Loading: Story = {
  args: {
    staffData: staffProfile,
    isAdminScope: false,
    permissionGroups: null,
    permissionOverrides: null,
    loading: true,
    hasError: false,
  },
};

export const ErrorState: Story = {
  args: {
    staffData: staffProfile,
    isAdminScope: false,
    permissionGroups: null,
    permissionOverrides: null,
    loading: false,
    hasError: true,
  },
};
