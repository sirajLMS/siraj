import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobilePageHeader } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";
import {
  FilterAddActions,
  MobilePageHeaderAllVariants,
  ReportActions,
  StickyScrollDecorator,
} from "@/frontend/mobile/components/ui/container/page/MobilePageHeader.stories.helpers";

const meta: Meta<typeof MobilePageHeader> = {
  title: "UI/PageHeader/Mobile",
  component: MobilePageHeader,
  tags: ["ai-generated"],
  args: {
    title: "Dashboard Overview",
    subtitle: "Real-time tracking of institutional activities.",
    edgeToEdge: true,
    sticky: false,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobilePageHeader>;

export const Default: Story = {
  args: {
    title: "Dashboard Overview",
    subtitle: "Real-time tracking of institutional activities.",
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Student Details",
    subtitle: "Manage enrollment records, attendance, and personal information.",
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: "Edit Student Profile",
    subtitle: "Manage enrollment records and personal details.",
    breadcrumbs: [
      { label: "Students", href: "#" },
      { label: "John Doe", href: "#" },
      { label: "Edit Profile", current: true },
    ],
  },
};

export const WithActions: Story = {
  args: {
    title: "Reports Management",
    subtitle: "Generate and export institutional reports.",
    actions: <ReportActions />,
  },
};

export const EdgeToEdge: Story = {
  args: {
    title: "Edge-to-Edge Header",
    subtitle: "Full-width header with edge-to-edge padding on mobile.",
    edgeToEdge: true,
  },
};

export const WithoutEdgeToEdge: Story = {
  args: {
    title: "Standard Padding Header",
    subtitle: "Header with standard container padding.",
    edgeToEdge: false,
  },
};

export const Sticky: Story = {
  args: {
    title: "Sticky Header",
    subtitle: "Stays at the top when scrolling.",
    sticky: true,
    edgeToEdge: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  decorators: [
    Story => <StickyScrollDecorator Story={Story} spacerText="Scroll down to see the sticky header in action" />,
  ],
};

export const StickyWithActions: Story = {
  args: {
    title: "Sticky Header with Actions",
    subtitle: "Sticky header with action buttons.",
    sticky: true,
    edgeToEdge: true,
    actions: <FilterAddActions />,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  decorators: [
    Story => <StickyScrollDecorator Story={Story} spacerText="Scroll down to see the sticky header with actions" />,
  ],
};

export const AllVariants: Story = {
  render: () => <MobilePageHeaderAllVariants />,
};
