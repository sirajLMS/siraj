import PeopleIcon from "@mui/icons-material/People";
import WarningIcon from "@mui/icons-material/Warning";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileMetricCard } from "@/frontend/mobile/components/ui/card/MobileMetricCard";

const meta: Meta<typeof MobileMetricCard> = {
  title: "UI/MetricCard/Mobile",
  component: MobileMetricCard,
  tags: ["ai-generated"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error", "highlight", "danger"],
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
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileMetricCard>;

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
  globals: { locale: "ar" },
  args: {
    label: "إجمالي الطلاب",
    value: "١٢٥٠",
    subLabel: "+١٢٪ منذ الشهر الماضي",
  },
};
