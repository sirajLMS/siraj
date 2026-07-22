import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import PeopleIcon from "@mui/icons-material/People";
import WarningIcon from "@mui/icons-material/Warning";
import type { Meta, StoryObj } from "@storybook/react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui/card/MobileMetricCardGrid";

const sampleMetrics: readonly MetricItem[] = [
  {
    key: "students",
    count: 1250,
    labelKey: "students",
    label: "Total Students",
    icon: PeopleIcon,
    subLabel: "+12% from last month",
  },
  {
    key: "suspended",
    count: 12,
    labelKey: "suspended",
    label: "Suspended Accounts",
    icon: WarningIcon,
    variant: "error",
    subLabel: "Requires action",
  },
  {
    key: "active",
    count: 42,
    labelKey: "active",
    label: "Active Classes",
    icon: CheckCircleOutlined,
  },
  {
    key: "pending",
    count: 8,
    labelKey: "pending",
    label: "Pending Reviews",
    icon: PeopleIcon,
  },
];

const meta: Meta<typeof MobileMetricCardGrid> = {
  title: "UI/MetricCard/Grid/Mobile",
  component: MobileMetricCardGrid,
  tags: ["ai-generated"],
  args: {
    metrics: sampleMetrics,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileMetricCardGrid>;

export const Default: Story = {};

export const WithSelection: Story = {
  args: {
    selectedKey: "students",
    onMetricClick: () => undefined,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    metrics: [
      {
        key: "students",
        count: "١٢٥٠",
        labelKey: "students",
        label: "إجمالي الطلاب",
        icon: PeopleIcon,
        subLabel: "+١٢٪ منذ الشهر الماضي",
      },
      {
        key: "suspended",
        count: 12,
        labelKey: "suspended",
        label: "حسابات موقوفة",
        icon: WarningIcon,
        variant: "error",
      },
    ] satisfies readonly MetricItem[],
  },
};
