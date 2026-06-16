import type { Meta, StoryObj } from "@storybook/react";
import { ManualInvoiceContainer } from "./ManualInvoiceContainer";

const meta: Meta<typeof ManualInvoiceContainer> = {
  title: "Views/dashboard/billing/manual/ManualInvoiceContainer",
  component: ManualInvoiceContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ManualInvoiceContainer>;

export const Default: Story = {
  args: {},
};
