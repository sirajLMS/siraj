import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { Meta, StoryObj } from "@storybook/react";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge/DesktopStatusBadge";

const meta: Meta<typeof DesktopStatusBadge> = {
  title: "UI/StatusBadge/Desktop",
  component: DesktopStatusBadge,
  tags: ["ai-generated"],
  args: {
    label: "Active",
    category: "session",
    status: "active",
  },
};

export default meta;
type Story = StoryObj<typeof DesktopStatusBadge>;

export const SessionActive: Story = {
  args: {
    label: "ACTIVE",
    category: "session",
    status: "active",
  },
};

export const SessionPending: Story = {
  args: {
    label: "PENDING",
    category: "session",
    status: "pending",
  },
};

export const InvoiceOverdue: Story = {
  args: {
    label: "OVERDUE",
    category: "invoice",
    status: "OVERDUE",
  },
};

export const StudentOnLeave: Story = {
  args: {
    label: "ON LEAVE",
    category: "studentAccount",
    status: "on_leave",
  },
};

export const WithIcon: Story = {
  args: {
    label: "VERIFIED",
    category: "enrollment",
    status: "regular",
    icon: <CheckCircleIcon />,
  },
};
