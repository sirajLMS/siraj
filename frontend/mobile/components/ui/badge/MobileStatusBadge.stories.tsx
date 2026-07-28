import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge/MobileStatusBadge";

const meta: Meta<typeof MobileStatusBadge> = {
  title: "UI/StatusBadge/Mobile",
  component: MobileStatusBadge,
  tags: ["ai-generated"],
  args: {
    label: "Active",
    category: "session",
    status: "active",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileStatusBadge>;

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
