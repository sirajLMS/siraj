import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type ReactNode, useEffect } from "react";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import { AdjustmentTypeRadioGroup } from "@/frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup";
import { CreditAdjustmentType } from "@/shared/constants/billing";

/**
 * Seeds the form store with the story's selected type and restores the pristine
 * form on unmount so selections never leak between stories.
 */
function StoreSeed({
  adjustmentType,
  children,
}: Readonly<{ adjustmentType: CreditAdjustmentType; children: ReactNode }>) {
  useEffect(() => {
    useCreditAdjustFormStore.setState({ adjustmentType });
    return () => {
      useCreditAdjustFormStore.getState().reset();
    };
  }, [adjustmentType]);
  return children;
}

const meta: Meta<typeof AdjustmentTypeRadioGroup> = {
  title: "Views/dashboard/accounting/credits/AdjustmentTypeRadioGroup",
  component: AdjustmentTypeRadioGroup,
  tags: ["autodocs"],
  args: { sectionTitle: "Adjustment type" },
  decorators: [
    Story => (
      <Box sx={{ width: "100%", maxWidth: 720, p: 2 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AddSelected: Story = {
  decorators: [
    Story => (
      <StoreSeed adjustmentType={CreditAdjustmentType.ADD}>
        <Story />
      </StoreSeed>
    ),
  ],
};

export const SubtractSelected: Story = {
  decorators: [
    Story => (
      <StoreSeed adjustmentType={CreditAdjustmentType.SUBTRACT}>
        <Story />
      </StoreSeed>
    ),
  ],
};

export const SubtractWithCarryoverSelected: Story = {
  decorators: [
    Story => (
      <StoreSeed adjustmentType={CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER}>
        <Story />
      </StoreSeed>
    ),
  ],
};
