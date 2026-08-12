"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import { cardFeedbackSx } from "@/frontend/common/components/ui/card/MetricCard/utils";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

export interface StyledCardProps {
  readonly isHighlight: boolean;
  readonly isError: boolean;
  readonly isInteractive: boolean;
}

/** Mobile layout: always compact column chrome. */
export const StyledCard = styled(MobileBaseCard, {
  shouldForwardProp: prop => prop !== "isHighlight" && prop !== "isError" && prop !== "isInteractive",
})<StyledCardProps>(({ theme, isHighlight, isError, isInteractive }) => ({
  padding: theme.spacing(1),
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  gap: theme.spacing(1),
  height: "100%",
  minHeight: 88,
  overflow: "hidden",
  cursor: isInteractive ? "pointer" : "default",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
  ...(isInteractive && {
    "&:active": {
      transform: "scale(0.99)",
    },
  }),
  ...cardFeedbackSx(theme, isHighlight, isError),
}));

export const MotionStyledCard = motion.create(StyledCard);

export const StyledCompactContentRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: theme.spacing(1.25),
  height: "100%",
  minWidth: 0,
}));

export const StyledCompactMiddleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  minWidth: 0,
}));

export const StyledValueContainer = styled(Box)({
  minWidth: 0,
});
