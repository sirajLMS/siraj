import type { Meta, StoryObj } from "@storybook/react";
import { ManagersContainer } from "./ManagersContainer";

const meta: Meta<typeof ManagersContainer> = {
  title: "Views/dashboard/managers/home/ManagersContainer",
  component: ManagersContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ManagersContainer>;

export const Default: Story = {
  args: {},
};
