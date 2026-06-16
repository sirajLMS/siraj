import type { Meta, StoryObj } from "@storybook/react";
import { ClassAuditContainer } from "./ClassAuditContainer";

const meta: Meta<typeof ClassAuditContainer> = {
  title: "Views/dashboard/classes/audit/ClassAuditContainer",
  component: ClassAuditContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ClassAuditContainer>;

export const Default: Story = {
  args: {},
};
