"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { CurrencyCode, IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import { useUserStore } from "@/frontend/stores/userStore";
import { ParentProfileView } from "@/frontend/views/dashboard/profile/parent/ParentProfileView";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;
type ParentOwnData = NonNullable<ProfileData["parentOwnProfile"]>;
type ParentAdminData = NonNullable<ProfileData["parentAdminProfile"]>;
type AssociatedStudents = ProfileData["associatedStudents"];

const parentOwnProfile: ParentOwnData = {
  id: "parent-own-1",
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  phone: "+966 50 123 4567",
  facebook: "facebook.com/noor.abdullah",
  whatsapp: "+966501234567",
  twitter: "@noor_abdullah",
};

const parentAdminProfile: ParentAdminData = {
  id: "parent-admin-1",
  userId: "user-parent-1",
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  avatarUrl: null,
  status: "REGULAR",
  phone: "+966 50 123 4567",
  nationality: "SA",
  address: "123 King Fahd Rd, Riyadh",
  facebook: "facebook.com/noor.abdullah",
  whatsapp: "+966501234567",
  twitter: "@noor_abdullah",
  invoiceType: "Monthly",
  feeAmount: "500",
  currency: CurrencyCode.Sar,
  displayAmount: null,
  timezone: IanaTimezone.AsiaRiyadh,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-06-01T00:00:00.000Z",
};

const associatedStudents: NonNullable<AssociatedStudents> = {
  id: "associated-students-1",
  totalCount: 2,
  rows: [
    {
      id: "student-1",
      name: "Adam Noor",
      studentAvatarUrl: null,
      status: "REGULAR",
      primaryTeacherId: "teacher-1",
      teacherUserId: "user-teacher-1",
      teacherName: "Ahmed Hassan",
      teacherAvatarUrl: null,
      hoursPerWeek: "3",
      classesRemaining: 14,
      classesTotal: 20,
    },
    {
      id: "student-2",
      name: "Layla Noor",
      studentAvatarUrl: null,
      status: "ON_TRIAL",
      primaryTeacherId: "teacher-2",
      teacherUserId: "user-teacher-2",
      teacherName: "Fatima Ali",
      teacherAvatarUrl: null,
      hoursPerWeek: "2",
      classesRemaining: 6,
      classesTotal: 10,
    },
  ],
};

const meta: Meta<typeof ParentProfileView> = {
  title: "Views/profile/parent",
  component: ParentProfileView,
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
type Story = StoryObj<typeof ParentProfileView>;

export const Default: Story = {
  args: {
    parentData: parentOwnProfile,
    associatedStudents,
    avatarUrl: "/demo/avatars/02.png",
    isAdminScope: false,
  },
};

export const AdminView: Story = {
  args: {
    parentData: parentAdminProfile,
    associatedStudents,
    avatarUrl: "/demo/avatars/02.png",
    isAdminScope: true,
  },
};

const parentWithStaleDisplayAmount: ParentAdminData = {
  ...parentAdminProfile,
  feeAmount: "500",
  currency: CurrencyCode.Sar,
  displayAmount: {
    id: "displayAmount:parent-admin-1:USD",
    amount: null,
    currency: CurrencyCode.Usd,
    stale: true,
  },
};

export const AdminViewWithStaleDisplayAmount: Story = {
  decorators: [
    Story => {
      useUserStore.setState({ displayCurrency: CurrencyCode.Usd });
      return <Story />;
    },
  ],
  args: {
    parentData: parentWithStaleDisplayAmount,
    associatedStudents,
    avatarUrl: "/demo/avatars/02.png",
    isAdminScope: true,
  },
};

export const SocialLinks: Story = {
  args: {
    parentData: {
      ...parentOwnProfile,
      facebook: "https://facebook.com/noor.abdullah",
      whatsapp: "+966501234567",
      twitter: "@noor_abdullah",
    },
    associatedStudents: { id: "associated-students-empty", totalCount: 0, rows: [] },
    avatarUrl: "/demo/avatars/02.png",
    isAdminScope: false,
  },
};

export const EmptyStudents: Story = {
  args: {
    parentData: parentOwnProfile,
    associatedStudents: { id: "associated-students-empty", totalCount: 0, rows: [] },
    isAdminScope: false,
  },
};
