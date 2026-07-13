import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "@/frontend/common/components/ui/container/page/PageHeader";

const meta: Meta<typeof PageHeader> = {
  title: "UI/PageHeader",
  component: PageHeader,
  tags: ["ai-generated"],
  args: {
    title: "Dashboard Overview",
    subtitle: "Real-time tracking of institutional activities.",
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: "Dashboard Overview",
    subtitle: "Real-time tracking of institutional activities.",
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: "Edit Student Profile",
    subtitle: "Manage enrollment records and personal details.",
    breadcrumbs: [
      { label: "Students", href: "#" },
      { label: "Edit Profile", current: true },
    ],
  },
};

export const WithActions: Story = {
  args: {
    title: "Reports Management",
    actions: (
      <>
        <Button variant="outlined">Export CSV</Button>
        <Button variant="contained">Generate Report</Button>
      </>
    ),
  },
};
