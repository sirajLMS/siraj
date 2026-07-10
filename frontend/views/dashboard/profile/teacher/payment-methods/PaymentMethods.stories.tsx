"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { PaymentMethodsView } from "@/frontend/views/dashboard/profile/teacher/payment-methods/PaymentMethodsView";

const meta: Meta<typeof PaymentMethodsView> = {
  title: "Profile/Teacher/PaymentMethods",
  component: PaymentMethodsView,
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 960, mx: "auto", p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PaymentMethodsView>;

export const Default: Story = {
  args: {
    targetUserId: "user-teacher-1",
  },
};
