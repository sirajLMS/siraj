import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import ErrorIcon from "@mui/icons-material/ErrorOutlined";
import InfoIcon from "@mui/icons-material/InfoOutlined";
import WarningIcon from "@mui/icons-material/WarningOutlined";
import { Box, Button, Chip, IconButton, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card/MobileCardListItem";

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

const SampleContent = () => (
  <Stack spacing={1} sx={{ width: "100%" }}>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      Card Title
    </Typography>
    <Typography variant="body1" color="text.secondary">
      This is the card description with some additional context about the item.
    </Typography>
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <Chip label="Active" size="small" color="success" variant="outlined" />
      <Chip label="Pending" size="small" color="warning" variant="outlined" />
    </Stack>
  </Stack>
);

const InteractiveContent = () => (
  <Stack spacing={1} sx={{ width: "100%" }}>
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Interactive Card
      </Typography>
      <IconButton size="small" aria-label="more actions">
        <EditIcon fontSize="small" />
      </IconButton>
    </Stack>
    <Typography variant="body1" color="text.secondary">
      Click or tap this card to interact with it. It has hover and active states.
    </Typography>
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <Button variant="outlined" size="small" startIcon={<EditIcon fontSize="small" />}>
        Edit
      </Button>
      <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon fontSize="small" />}>
        Delete
      </Button>
    </Stack>
  </Stack>
);

interface AccentContentProps {
  icon: React.ReactNode;
  color: "primary" | "info" | "error" | "warning";
}

const AccentContent = ({ icon, color }: AccentContentProps) => (
  <Stack spacing={1} sx={{ width: "100%" }}>
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <Box sx={{ color: theme => theme.palette[color].main }}>{icon}</Box>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {color.charAt(0).toUpperCase() + color.slice(1)} Alert
      </Typography>
    </Stack>
    <Typography variant="body1" color="text.secondary">
      This card has an accent border on the {color} side indicating status.
    </Typography>
  </Stack>
);

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
  render: () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3, maxWidth: 400 }}>
      <Typography variant="labelMd" sx={{ fontWeight: 600, mb: 1 }}>
        All Variants Combined
      </Typography>
      <MobileCardListItem variant="edge-to-edge" accentBorder={{ color: "primary", side: "inline-start" }}>
        <SampleContent />
      </MobileCardListItem>
      <MobileCardListItem variant="rounded" accentBorder={{ color: "info", side: "top" }}>
        <SampleContent />
      </MobileCardListItem>
      <MobileCardListItem variant="edge-to-edge" dimmed accentBorder={{ color: "warning", side: "bottom" }}>
        <SampleContent />
      </MobileCardListItem>
      <MobileCardListItem variant="rounded" interactive accentBorder={{ color: "error", side: "inline-end" }}>
        <InteractiveContent />
      </MobileCardListItem>
      <MobileCardListItem
        variant="edge-to-edge"
        dimmed
        interactive
        accentBorder={{ color: "primary", side: "inline-start" }}
      >
        <InteractiveContent />
      </MobileCardListItem>
    </Box>
  ),
};

export const WithCustomSx: Story = {
  args: {
    variant: "rounded",
    sx: { backgroundColor: "secondary.main", color: "secondary.contrastText" },
    children: (
      <Stack spacing={1} sx={{ width: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Custom Styled Card
        </Typography>
        <Typography variant="body1">This card uses custom sx props for custom styling.</Typography>
      </Stack>
    ),
  },
};
