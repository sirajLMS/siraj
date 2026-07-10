import type { Meta, StoryObj } from "@storybook/react";
import { DstMigrationContainer } from "@/frontend/views/dashboard/tools/dst-migration/DstMigrationContainer";

const meta: Meta<typeof DstMigrationContainer> = {
  title: "Views/dashboard/tools/dst-migration/DstMigrationContainer",
  component: DstMigrationContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof DstMigrationContainer>;

export const Default: Story = {
  args: {},
};
