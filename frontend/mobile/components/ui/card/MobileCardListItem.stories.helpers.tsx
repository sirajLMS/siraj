import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, Chip, IconButton, Stack, Typography } from "@mui/material";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card/MobileCardListItem";

export const SampleContent = () => (
  <Stack spacing={1} sx={{ width: "100%" }}>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      Card Title
    </Typography>
    <Typography variant="body1" sx={theme => ({ color: theme.palette.text.secondary })}>
      This is the card description with some additional context about the item.
    </Typography>
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <Chip label="Active" size="small" color="success" variant="outlined" />
      <Chip label="Pending" size="small" color="warning" variant="outlined" />
    </Stack>
  </Stack>
);

export const InteractiveContent = () => (
  <Stack spacing={1} sx={{ width: "100%" }}>
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Interactive Card
      </Typography>
      <IconButton size="small" aria-label="more actions">
        <EditIcon fontSize="small" />
      </IconButton>
    </Stack>
    <Typography variant="body1" sx={theme => ({ color: theme.palette.text.secondary })}>
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

export const AccentContent = ({ icon, color }: AccentContentProps) => (
  <Stack spacing={1} sx={{ width: "100%" }}>
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <Box sx={{ color: theme => theme.palette[color].main }}>{icon}</Box>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {color.charAt(0).toUpperCase() + color.slice(1)} Alert
      </Typography>
    </Stack>
    <Typography variant="body1" sx={theme => ({ color: theme.palette.text.secondary })}>
      This card has an accent border on the {color} side indicating status.
    </Typography>
  </Stack>
);

export const AllVariantsCombinedContent = () => (
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
);

export const CustomSxContent = () => (
  <Stack spacing={1} sx={{ width: "100%" }}>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      Custom Styled Card
    </Typography>
    <Typography variant="body1">This card uses custom sx props for custom styling.</Typography>
  </Stack>
);
