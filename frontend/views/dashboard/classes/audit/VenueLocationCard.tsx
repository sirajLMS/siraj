"use client";

import { MapOutlined, MeetingRoomOutlined } from "@mui/icons-material";
import { Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import type { VenueInfo } from "./types";

interface VenueLocationCardProps {
  readonly venue: VenueInfo;
  readonly labels: {
    readonly title: string;
    readonly capacity: string;
    readonly viewMap: string;
    readonly capacityBadge: string;
  };
  readonly onViewMap: () => void;
}

// Primary-colored section title used on the desktop card header
const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Hover-tinted preview container used for both mobile header and desktop venue image area
const StyledVenuePreviewContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

// Disabled meeting-room icon shown in the mobile preview (smaller + 0.4 opacity)
const StyledMobileDoorIcon = styled(MeetingRoomOutlined)(({ theme }) => ({
  fontSize: 48,
  color: theme.palette.text.disabled,
  opacity: 0.4,
}));

// Disabled meeting-room icon shown in the desktop preview (larger + 0.3 opacity)
const StyledDesktopDoorIcon = styled(MeetingRoomOutlined)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.text.disabled,
  opacity: 0.3,
}));

// Header-tinted capacity badge positioned at the top-right of the mobile preview
const StyledCapacityBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 8,
  right: 8,
  backgroundColor: theme.palette.header,
  color: theme.palette.onHeader,
  paddingInline: theme.spacing(1),
  paddingBlock: theme.spacing(0.5),
  borderRadius: 1,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.card,
}));

// Primary-colored venue name used in the mobile card's detail section
const StyledMobileVenueName = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Secondary muted text used for the floor/hall location line
const StyledLocationText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Scrim-gradient overlay covering the desktop preview to lift text at the bottom
const StyledDesktopScrimOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  inset: 0,
  background: `linear-gradient(to top, ${theme.palette.scrim}, transparent)`,
  display: "flex",
  alignItems: "flex-end",
  padding: theme.spacing(2),
}));

// Bold onPrimary venue name shown atop the desktop scrim overlay
const StyledOverlayVenueName = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimary,
  fontWeight: 700,
}));

// OnPrimary caption shown next to the venue name in the desktop overlay
const StyledOverlayLocationText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimary,
}));

// PrimaryContainer-tinted capacity info row at the bottom of the desktop card
const StyledCapacityInfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.primaryContainer,
  borderRadius: 2,
}));

// OnPrimaryContainer icon leading the desktop capacity row
const StyledCapacityInfoIcon = styled(MeetingRoomOutlined)(({ theme }) => ({
  color: theme.palette.onPrimaryContainer,
}));

// Bold onPrimaryContainer label used for the capacity count
const StyledCapacityCountLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.onPrimaryContainer,
}));

// OnPrimaryContainer uppercase text used for the features list
const StyledFeaturesText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimaryContainer,
}));

const MobileVenueCard = ({ venue, labels, onViewMap }: VenueLocationCardProps) => {
  const capacityBadge = labels.capacityBadge.replace("{count}", String(venue.capacity));

  return (
    <BaseCard sx={{ p: 0, overflow: "hidden" }}>
      <StyledVenuePreviewContainer sx={{ height: 128 }}>
        <StyledMobileDoorIcon />
        <StyledCapacityBadge>{capacityBadge}</StyledCapacityBadge>
      </StyledVenuePreviewContainer>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <StyledMobileVenueName variant="titleLg">{venue.name}</StyledMobileVenueName>
          <StyledLocationText variant="bodyMd">
            {venue.floor}, {venue.hall}
          </StyledLocationText>
        </Box>
        <Button
          id="venue-view-map-mobile"
          variant="contained"
          startIcon={<MapOutlined />}
          onClick={onViewMap}
          sx={{ typography: "labelUppercase" }}
        >
          {labels.viewMap}
        </Button>
      </Box>
    </BaseCard>
  );
};

const DesktopVenueCard = ({ venue, labels }: Omit<VenueLocationCardProps, "onViewMap">) => {
  const capacityText = labels.capacity.replace("{count}", String(venue.capacity));

  return (
    <BaseCard>
      <StyledSectionTitle variant="titleLg" sx={{ mb: 2 }}>
        {labels.title}
      </StyledSectionTitle>
      <StyledVenuePreviewContainer
        sx={{
          aspectRatio: "16/9",
          borderRadius: 2,
          overflow: "hidden",
          mb: 2,
        }}
      >
        <StyledDesktopDoorIcon />
        <StyledDesktopScrimOverlay>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <StyledOverlayVenueName variant="bodyLg">{venue.name}:</StyledOverlayVenueName>
            <StyledOverlayLocationText variant="labelMd">
              {venue.floor}, {venue.hall}
            </StyledOverlayLocationText>
          </Box>
        </StyledDesktopScrimOverlay>
      </StyledVenuePreviewContainer>
      <StyledCapacityInfoRow>
        <StyledCapacityInfoIcon />
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
          }}
        >
          <StyledCapacityCountLabel variant="labelMd">{capacityText}:</StyledCapacityCountLabel>
          <StyledFeaturesText variant="labelUppercase">{venue.features}</StyledFeaturesText>
        </Box>
      </StyledCapacityInfoRow>
    </BaseCard>
  );
};

export function VenueLocationCard(props: VenueLocationCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <MobileVenueCard {...props} />;
  }

  return <DesktopVenueCard {...props} />;
}
