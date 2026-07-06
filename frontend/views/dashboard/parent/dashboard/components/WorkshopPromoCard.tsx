"use client";

import { ArrowForwardOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Chip, Typography } from "@mui/material";
import type { WorkshopPromo } from "../types/parentDashboardTypes";

interface WorkshopPromoCardProps {
  readonly promo: WorkshopPromo;
  readonly labels: {
    readonly badge: string;
    readonly learnMore: string;
  };
  readonly onLearnMore: () => void;
}

export function WorkshopPromoCard({ promo, labels, onLearnMore }: Readonly<WorkshopPromoCardProps>) {
  return (
    <Box
      sx={{
        position: "relative",
        height: 240,
        borderRadius: 3,
        overflow: "hidden",
        "&:hover img": {
          transform: "scale(1.05)",
        },
      }}
    >
      <Box
        component="img"
        src={promo.imageUrl}
        alt={promo.title}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.7s ease",
        }}
      />
      <Box
        sx={theme => ({
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          p: 3,
          background: `linear-gradient(to top, ${alpha(theme.palette.primary.main, 0.9)}, transparent)`,
        })}
      >
        <Chip
          label={labels.badge}
          size="small"
          sx={theme => ({
            width: "fit-content",
            mb: 1.5,
            backgroundColor: theme.palette.header,
            color: theme.palette.onPrimary,
            fontWeight: 700,
            textTransform: "uppercase",
            fontSize: 10,
          })}
        />
        <Typography variant="headlineMd" sx={{ color: theme => theme.palette.onPrimary, mb: 1 }}>
          {promo.title}
        </Typography>
        <Typography
          variant="bodyMd"
          sx={{ color: theme => theme.palette.onPrimary, opacity: 0.8, mb: 2, maxWidth: 360 }}
        >
          {promo.description}
        </Typography>
        <Button
          variant="text"
          endIcon={<ArrowForwardOutlined />}
          onClick={onLearnMore}
          sx={theme => ({
            width: "fit-content",
            color: theme.palette.onPrimary,
            fontWeight: 700,
            letterSpacing: "0.1em",
            borderBottom: `1px solid ${theme.palette.onPrimary}`,
            borderRadius: 0,
            px: 0,
            pb: 0.5,
            "&:hover": {
              backgroundColor: "transparent",
              opacity: 0.9,
            },
          })}
        >
          {labels.learnMore}
        </Button>
      </Box>
    </Box>
  );
}
