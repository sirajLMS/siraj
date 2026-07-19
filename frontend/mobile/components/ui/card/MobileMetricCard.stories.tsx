import PeopleIcon from "@mui/icons-material/People";
import WarningIcon from "@mui/icons-material/Warning";
import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
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
      viewports: {
        mobile1: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobile2: {
          name: "Mobile Large (414px)",
          styles: { width: "414px", height: "896px" },
        },
        tablet: {
          name: "Tablet (768px)",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop (1280px)",
          styles: { width: "1280px", height: "800px" },
        },
      },
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
