"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { ParentProfileEditForm } from "./ParentProfileEditForm";

const ownParentData = {
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  phone: "+966 50 123 4567",
  facebook: "facebook.com/noor.abdullah",
  whatsapp: "+966501234567",
  twitter: "@noor_abdullah",
  defaultZoomLink: "https://zoom.us/j/parent123",
};

const adminParentData = {
  ...ownParentData,
  nationality: "Saudi Arabia",
  address: "123 King Fahd Rd, Riyadh",
  invoiceType: "Monthly",
  feeAmount: "500",
  paymentMethod: "Bank Transfer",
  currency: "SAR",
  timezone: "Asia/Riyadh" as const,
};

const meta: Meta<typeof ParentProfileEditForm> = {
  title: "Profile/Parent/ParentProfileEditForm",
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 960, mx: "auto", p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ParentProfileEditForm>;

export const OwnEdit: Story = {
  render: () => (
    <ParentProfileEditForm
      parentData={ownParentData}
      isAdminScope={false}
      isSaving={false}
      onSubmit={async () => {
        await Promise.resolve();
      }}
    />
  ),
};

export const AdminEdit: Story = {
  render: () => (
    <ParentProfileEditForm
      parentData={adminParentData}
      isAdminScope={true}
      isSaving={false}
      onSubmit={async () => {
        await Promise.resolve();
      }}
    />
  ),
};
