"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import type { ProfileByUserIdQuery } from "@/frontend/graphql/generated/gql/operations";
import { TeacherBankingEmptyState } from "@/frontend/views/dashboard/profile/teacher/banking/TeacherBankingEmptyState";
import { TeacherBankingView } from "@/frontend/views/dashboard/profile/teacher/banking/TeacherBankingView";

const mockBanking: NonNullable<NonNullable<ProfileByUserIdQuery["profileByUserId"]>["bankingSummary"]> = {
  id: "banking-1",
  beneficiaryName: "J****c",
  bankName: "F*****l",
  accountNumber: "****5678",
  routingNumber: "****1234",
  swiftBic: "FN****33",
  iban: null,
  verifiedAt: "2023-10-12T00:00:00.000Z",
  verifiedByUserId: "admin-1",
  verifiedByName: "Admin Sarah",
};

const meta: Meta = {
  title: "Views/profile/teacher/banking",
  tags: ["autodocs"],
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 960, mx: "auto", p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const BankingView: Story = {
  render: () => <TeacherBankingView banking={mockBanking} targetUserId="teacher-user-1" mode="view" />,
};

export const BankingViewVerified: Story = {
  render: () => (
    <TeacherBankingView
      banking={{ ...mockBanking, verifiedAt: null, verifiedByName: null, verifiedByUserId: null }}
      targetUserId="teacher-user-1"
      mode="view"
    />
  ),
};

export const BankingEmptyState: Story = {
  render: () => <TeacherBankingEmptyState />,
};
