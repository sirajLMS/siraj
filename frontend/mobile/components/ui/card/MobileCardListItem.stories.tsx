import ErrorIcon from "@mui/icons-material/ErrorOutlined";
import InfoIcon from "@mui/icons-material/InfoOutlined";
import WarningIcon from "@mui/icons-material/WarningOutlined";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card/MobileCardListItem";
import {
  AccentContent,
  AllVariantsCombinedContent,
  CustomSxContent,
  InteractiveContent,
  SampleContent,
} from "@/frontend/mobile/components/ui/card/MobileCardListItem.stories.helpers";

const meta: Meta<typeof MobileCardListItem> = {
  title: "UI/CardListItem/Mobile",
  component: MobileCardListItem,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
  args: {
    variant: "edge-to-edge",
    dimmed: false,
    interactive: false,
  },
};

export default meta;
type Story = StoryObj<typeof MobileCardListItem>;

export const EdgeToEdge: Story = {
  args: {
    variant: "edge-to-edge",
    children: <SampleContent />,
  },
};

export const Rounded: Story = {
  args: {
    variant: "rounded",
    children: <SampleContent />,
  },
};

export const Dimmed: Story = {
  args: {
    variant: "edge-to-edge",
    dimmed: true,
    children: <SampleContent />,
  },
};

export const DimmedCustomOpacity: Story = {
  args: {
    variant: "rounded",
    dimmed: true,
    dimmedOpacity: 0.5,
    children: <SampleContent />,
  },
};

export const Interactive: Story = {
  args: {
    variant: "rounded",
    interactive: true,
    children: <InteractiveContent />,
  },
};

export const InteractiveEdgeToEdge: Story = {
  args: {
    variant: "edge-to-edge",
    interactive: true,
    children: <InteractiveContent />,
  },
};

export const AccentBorderPrimaryInlineStart: Story = {
  args: {
    variant: "rounded",
    accentBorder: { color: "primary", side: "inline-start", width: 4 },
    children: <AccentContent icon={<InfoIcon />} color="primary" />,
  },
};

export const AccentBorderPrimaryInlineEnd: Story = {
  args: {
    variant: "rounded",
    accentBorder: { color: "primary", side: "inline-end", width: 4 },
    children: <AccentContent icon={<InfoIcon />} color="primary" />,
  },
};

export const AccentBorderInfoTop: Story = {
  args: {
    variant: "rounded",
    accentBorder: { color: "info", side: "top", width: 3 },
    children: <AccentContent icon={<InfoIcon />} color="info" />,
  },
};

export const AccentBorderErrorBottom: Story = {
  args: {
    variant: "rounded",
    accentBorder: { color: "error", side: "bottom", width: 4 },
    children: <AccentContent icon={<ErrorIcon />} color="error" />,
  },
};

export const AccentBorderWarningInlineStart: Story = {
  args: {
    variant: "edge-to-edge",
    accentBorder: { color: "warning", side: "inline-start", width: 5 },
    children: <AccentContent icon={<WarningIcon />} color="warning" />,
  },
};

export const AccentBorderErrorInlineEnd: Story = {
  args: {
    variant: "rounded",
    accentBorder: { color: "error", side: "inline-end", width: 5 },
    children: <AccentContent icon={<ErrorIcon />} color="error" />,
  },
};

export const CombinedEdgeToEdgeDimmed: Story = {
  args: {
    variant: "edge-to-edge",
    dimmed: true,
    children: <SampleContent />,
  },
};

export const CombinedRoundedInteractiveAccent: Story = {
  args: {
    variant: "rounded",
    interactive: true,
    accentBorder: { color: "primary", side: "inline-start", width: 4 },
    children: <InteractiveContent />,
  },
};

export const CombinedAllVariants: Story = {
  args: {
    variant: "rounded",
    dimmed: true,
    interactive: true,
    accentBorder: { color: "error", side: "inline-start", width: 4 },
    children: <InteractiveContent />,
  },
};

export const AllVariantsCombined: Story = {
  render: () => <AllVariantsCombinedContent />,
};

export const WithCustomSx: Story = {
  args: {
    variant: "rounded",
    sx: theme => ({ backgroundColor: theme.palette.secondary.main, color: theme.palette.onSecondary }),
    children: <CustomSxContent />,
  },
};
