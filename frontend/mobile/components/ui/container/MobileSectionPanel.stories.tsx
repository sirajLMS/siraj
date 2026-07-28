import { Button, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container/MobileSectionPanel";

const meta: Meta<typeof MobileSectionPanel> = {
  title: "UI/SectionPanel/Mobile",
  component: MobileSectionPanel,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
  args: {
    title: "Student Information",
    subTitle: "Personal details and academic records.",
    children: (
      <Typography variant="bodyMd">
        Content of the section panel goes here. It is wrapped in a mobile-tuned Paper shell with optional edge-to-edge
        layout.
      </Typography>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof MobileSectionPanel>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    actions: <Button variant="text">Edit Info</Button>,
  },
};

export const RoundedInset: Story = {
  args: {
    edgeToEdge: false,
    title: "Inset Panel",
    subTitle: "Rounded corners with inline padding on content.",
  },
};

export const ContentOnly: Story = {
  args: {
    title: undefined,
    subTitle: undefined,
  },
};
