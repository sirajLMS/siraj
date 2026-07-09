import PeopleIcon from "@mui/icons-material/People";
import WarningIcon from "@mui/icons-material/Warning";
import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { MetricCard } from ".";

const meta: Meta<typeof MetricCard> = {
  title: "UI/MetricCard",
  component: MetricCard,
  tags: ["ai-generated"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error", "highlight", "danger", "compact"],
    },
    onClick: { action: "clicked" },
  },
  args: {
    icon: PeopleIcon,
    label: "Total Students",
    value: 1250,
    variant: "default",
    animated: false,
  },
};

export default meta;
type Story = StoryObj<typeof MetricCard>;

export const Default: Story = {
  args: {
    label: "Total Students",
    value: 1250,
    subLabel: "+12% from last month",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/total students/i)).toBeVisible();
    await expect(canvas.getByText("1250")).toBeVisible();
  },
};

export const CssCheck: Story = {
  args: {
    label: "CSS Test",
    value: "Style",
  },
  play: async ({ canvas }) => {
    const label = canvas.getByText(/css test/i);
    // In dark mode (default), primary.main is #2DD4BF -> rgb(45, 212, 191)
    await expect(getComputedStyle(label).color).toBe("rgb(45, 212, 191)");
  },
};

export const ErrorState: Story = {
  args: {
    label: "Suspended Accounts",
    value: 12,
    variant: "error",
    icon: WarningIcon,
    subLabel: "Requires immediate action",
  },
};

export const Selected: Story = {
  args: {
    label: "Regular Classes",
    value: 42,
    variant: "highlight",
    onClick: () => undefined,
  },
};

export const Interactive: Story = {
  args: {
    label: "Regular Classes",
    value: 42,
    onClick: () => undefined,
  },
};

export const Arabic: Story = {
  parameters: {
    locale: "ar",
  },
  args: {
    label: "إجمالي الطلاب",
    value: "١٢٥٠",
    subLabel: "+١٢٪ منذ الشهر الماضي",
  },
};
