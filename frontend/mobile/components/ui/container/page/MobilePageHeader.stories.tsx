import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobilePageHeader } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";

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
    actions: (
      <>
        <Button variant="outlined" size="small">
          Export CSV
        </Button>
        <Button variant="contained" size="small">
          Generate Report
        </Button>
      </>
    ),
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
    Story => (
      <div style={{ height: "200vh", paddingBottom: "100px" }}>
        <Story />
        <div style={{ padding: "16px", marginTop: "200px" }}>
          <p>Scroll down to see the sticky header in action</p>
        </div>
      </div>
    ),
  ],
};

export const StickyWithActions: Story = {
  args: {
    title: "Sticky Header with Actions",
    subtitle: "Sticky header with action buttons.",
    sticky: true,
    edgeToEdge: true,
    actions: (
      <>
        <Button variant="outlined" size="small">
          Filter
        </Button>
        <Button variant="contained" size="small">
          Add New
        </Button>
      </>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  decorators: [
    Story => (
      <div style={{ height: "200vh", paddingBottom: "100px" }}>
        <Story />
        <div style={{ padding: "16px", marginTop: "200px" }}>
          <p>Scroll down to see the sticky header with actions</p>
        </div>
      </div>
    ),
  ],
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", padding: "16px" }}>
      <div>
        <h4 style={{ marginBottom: "8px", fontWeight: 600 }}>Default</h4>
        <MobilePageHeader title="Dashboard" subtitle="Overview" />
      </div>
      <div>
        <h4 style={{ marginBottom: "8px", fontWeight: 600 }}>With Breadcrumbs</h4>
        <MobilePageHeader
          title="Edit Profile"
          breadcrumbs={[
            { label: "Settings", href: "#" },
            { label: "Profile", current: true },
          ]}
        />
      </div>
      <div>
        <h4 style={{ marginBottom: "8px", fontWeight: 600 }}>With Actions</h4>
        <MobilePageHeader
          title="Reports"
          actions={
            <>
              <Button variant="outlined" size="small">
                Export
              </Button>
              <Button variant="contained" size="small">
                Generate
              </Button>
            </>
          }
        />
      </div>
      <div>
        <h4 style={{ marginBottom: "8px", fontWeight: 600 }}>Edge-to-Edge</h4>
        <MobilePageHeader title="Full Width" edgeToEdge={true} />
      </div>
      <div>
        <h4 style={{ marginBottom: "8px", fontWeight: 600 }}>Sticky</h4>
        <div style={{ height: "100vh" }}>
          <MobilePageHeader title="Sticky Header" sticky={true} edgeToEdge={true} />
          <div style={{ padding: "16px", marginTop: "200px" }}>Scroll content...</div>
        </div>
      </div>
    </div>
  ),
};
