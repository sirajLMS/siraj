import ClassIcon from "@mui/icons-material/Class";
import PeopleIcon from "@mui/icons-material/People";
import WarningIcon from "@mui/icons-material/Warning";
import type { Meta, StoryObj } from "@storybook/react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid/DesktopMetricCardGrid";

const sampleMetrics: readonly MetricItem[] = [
  {
    key: "students",
    count: 1250,
    labelKey: "metrics.students",
    label: "Total Students",
    icon: PeopleIcon,
    subLabel: "+12% from last month",
  },
  {
    key: "classes",
    count: 42,
    labelKey: "metrics.classes",
    label: "Active Classes",
    icon: ClassIcon,
  },
  {
    key: "suspended",
    count: 12,
    labelKey: "metrics.suspended",
    label: "Suspended Accounts",
    icon: WarningIcon,
    variant: "error",
    subLabel: "Requires action",
  },
  {
    key: "teachers",
    count: 86,
    labelKey: "metrics.teachers",
    label: "Teachers",
    icon: PeopleIcon,
  },
];

const meta: Meta<typeof DesktopMetricCardGrid> = {
  title: "UI/MetricCard/Grid/Desktop",
  component: DesktopMetricCardGrid,
  tags: ["ai-generated"],
  args: {
    metrics: sampleMetrics,
  },
  argTypes: {
    onMetricClick: { action: "metricClicked" },
  },
};

export default meta;
type Story = StoryObj<typeof DesktopMetricCardGrid>;

export const Default: Story = {};

export const WithSelection: Story = {
  args: {
    selectedKey: "classes",
    onMetricClick: () => undefined,
  },
};

export const ScrollLayout: Story = {
  args: {
    layout: "scroll",
    onMetricClick: () => undefined,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    metrics: sampleMetrics.map(metric => {
      const arabicLabel =
        metric.key === "students"
          ? "إجمالي الطلاب"
          : metric.key === "classes"
            ? "الحصص النشطة"
            : metric.key === "suspended"
              ? "حسابات موقوفة"
              : "المعلمون";

      return {
        ...metric,
        label: arabicLabel,
      };
    }),
  },
};
