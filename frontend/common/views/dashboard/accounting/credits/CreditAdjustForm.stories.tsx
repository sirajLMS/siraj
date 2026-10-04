import { MockedProvider } from "@apollo/client/testing/react";
import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotificationsProvider } from "@toolpad/core/useNotifications";
import { type ReactNode, useEffect } from "react";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import { CreditAdjustForm } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm";
import {
  carryoverInput,
  preselectedStudentMock,
  STUDENT_ID,
  studentDirectoryMock,
  successMutationMock,
  TEACHER_ID,
  teachersMock,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.stories.fixtures";
import { CreditAdjustmentType } from "@/shared/constants/billing";

/**
 * Seeds a complete carryover draft (the pickers keep their display values
 * locally, so only the store-bound fields render pre-populated) and restores
 * the pristine form on unmount so values never leak between stories.
 */
function StoreSeed({ children }: Readonly<{ children: ReactNode }>) {
  useEffect(() => {
    useCreditAdjustFormStore.setState({
      studentId: STUDENT_ID,
      adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
      hours: 4,
      notes: carryoverInput.notes ?? "",
      carryoverTeacherId: TEACHER_ID,
      fromDate: carryoverInput.carryoverFromDate,
      toDate: carryoverInput.carryoverToDate,
      paymentDate: carryoverInput.carryoverPaymentDate,
    });
    return () => {
      useCreditAdjustFormStore.getState().reset();
    };
  }, []);
  return children;
}

const meta: Meta<typeof CreditAdjustForm> = {
  title: "Views/dashboard/accounting/credits/CreditAdjustForm",
  component: CreditAdjustForm,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { studentId: null },
  decorators: [
    Story => (
      <Box sx={{ width: "100%", maxWidth: 960, mx: "auto" }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  decorators: [
    Story => (
      <MockedProvider mocks={[studentDirectoryMock, teachersMock]}>
        <NotificationsProvider>
          <Story />
        </NotificationsProvider>
      </MockedProvider>
    ),
  ],
};

export const PreselectedStudent: Story = {
  args: { studentId: STUDENT_ID },
  decorators: [
    Story => (
      <MockedProvider mocks={[studentDirectoryMock, teachersMock, preselectedStudentMock]}>
        <NotificationsProvider>
          <Story />
        </NotificationsProvider>
      </MockedProvider>
    ),
  ],
};

export const CarryoverExpanded: Story = {
  decorators: [
    Story => (
      <StoreSeed>
        <MockedProvider mocks={[studentDirectoryMock, teachersMock, successMutationMock]}>
          <NotificationsProvider>
            <Story />
          </NotificationsProvider>
        </MockedProvider>
      </StoreSeed>
    ),
  ],
};
