"use client";

import { MapOutlined, MeetingRoomOutlined } from "@mui/icons-material";
import { Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import { BaseCard } from "@/frontend/components/ui";
import type { VenueInfo } from "@/frontend/stores/classAuditStore";

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

const MobileVenueCard = ({ venue, labels, onViewMap }: VenueLocationCardProps) => {
  const capacityBadge = labels.capacityBadge.replace("{count}", String(venue.capacity));

  return (
    <BaseCard sx={{ p: 0, overflow: "hidden" }}>
      <Box
        sx={theme => ({
          height: 128,
          bgcolor: theme.palette.action.hover,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <MeetingRoomOutlined
          sx={theme => ({
            fontSize: 48,
            color: theme.palette.text.disabled,
            opacity: 0.4,
          })}
        />
        <Box
          sx={theme => ({
            position: "absolute",
            top: 8,
            right: 8,
            bgcolor: theme.palette.header,
            color: theme.palette.onHeader,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            typography: "labelUppercase",
            boxShadow: theme.palette.shadow.card,
          })}
        >
          {capacityBadge}
        </Box>
      </Box>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
            {venue.name}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {venue.floor}, {venue.hall}
          </Typography>
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
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, mb: 2 })}>
        {labels.title}
      </Typography>
      <Box
        sx={theme => ({
          aspectRatio: "16/9",
          borderRadius: 2,
          bgcolor: theme.palette.action.hover,
          position: "relative",
          overflow: "hidden",
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <MeetingRoomOutlined sx={theme => ({ fontSize: 64, color: theme.palette.text.disabled, opacity: 0.3 })} />
        <Box
          sx={theme => ({
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, ${theme.palette.scrim}, transparent)`,
            display: "flex",
            alignItems: "flex-end",
            p: 2,
          })}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.onPrimary, fontWeight: 700 })}>
              {venue.name}:
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onPrimary })}>
              {venue.floor}, {venue.hall}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          bgcolor: theme.palette.primaryContainer,
          borderRadius: 2,
        })}
      >
        <MeetingRoomOutlined sx={theme => ({ color: theme.palette.onPrimaryContainer })} />
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
          }}
        >
          <Typography variant="labelMd" sx={theme => ({ fontWeight: 700, color: theme.palette.onPrimaryContainer })}>
            {capacityText}:
          </Typography>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onPrimaryContainer })}>
            {venue.features}
          </Typography>
        </Box>
      </Box>
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
