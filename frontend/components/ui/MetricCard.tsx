"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Box, type SxProps, type Theme, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { BaseCard } from "./BaseCard";
import { mergeSx } from "./mergeSx";

export type MetricCardVariant = "default" | "error" | "highlight" | "danger" | "compact";

interface MetricCardProps {
  readonly icon: SvgIconComponent;
  readonly label: string;
  readonly value: number | string;
  readonly variant?: MetricCardVariant;
  readonly subLabel?: string;
  readonly animated?: boolean;
  readonly animationIndex?: number;
  readonly onClick?: () => void;
  readonly sx?: SxProps;
}

const MotionBaseCard = motion.create(BaseCard);

function formatValue(value: number | string): string {
  if (typeof value === "number") {
    return String(value);
  }
  return value;
}

function valueColor({ variant, theme }: { variant: MetricCardVariant; theme: Theme }) {
  switch (variant) {
    case "error":
      return theme.palette.error.main;
    case "highlight":
      return theme.palette.primary.light;
    case "danger":
      return theme.palette.error.main;
    case "default":
      return theme.palette.primary.main;
    case "compact":
      return theme.palette.primary.main;
  }
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  subLabel,
  animated = false,
  animationIndex = 0,
  onClick,
  sx,
}: MetricCardProps) {
  const isError = variant === "error" || variant === "danger";
  const isHighlight = variant === "highlight";
  const isCompact = variant === "compact";

  const cardContent = (
    <>
      <Box
        sx={{
          ml: isCompact ? 0 : 0.5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          height: "100%",
        }}
      >
        <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.primary.main, mb: 0.5 })}>
          {label}
        </Typography>
        <Typography
          variant={isCompact ? "headlineMd" : "headlineLg"}
          sx={theme => ({
            fontWeight: 700,
            color: valueColor({ variant, theme }),
            lineHeight: 1,
          })}
        >
          {formatValue(value)}
        </Typography>
        {subLabel && (
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.dark, mt: 0.5 })}>
            {subLabel}
          </Typography>
        )}
      </Box>
      <Box
        className="metric-icon-wrap"
        sx={theme => ({
          width: isCompact ? 40 : 44,
          height: isCompact ? 40 : 44,
          borderRadius: "50%",
          border: "2px solid",
          borderColor: isError ? theme.palette.error.main : theme.palette.primary.main,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background-color 0.15s ease, color 0.15s ease",
        })}
      >
        <Icon
          sx={theme => ({
            fontSize: isCompact ? 20 : 22,
            color: isError ? theme.palette.error.main : theme.palette.primary.main,
          })}
        />
      </Box>
    </>
  );

  const cardSx = (theme: Theme) => ({
    p: isCompact ? 2 : 2.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    ...(isHighlight && {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
    }),
    ...(isError && {
      borderColor: theme.palette.error.light,
    }),
    "&:hover .metric-icon-wrap": onClick
      ? {
          backgroundColor: isError ? theme.palette.error.main : theme.palette.primary.main,
          borderColor: isError ? theme.palette.error.main : theme.palette.primary.main,
          "& .MuiSvgIcon-root": { color: isError ? theme.palette.onError : theme.palette.onPrimary },
        }
      : undefined,
  });

  const mergedSx = mergeSx(cardSx, sx);

  if (animated) {
    return (
      <MotionBaseCard
        interactive={Boolean(onClick)}
        onClick={onClick}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: animationIndex * 0.04,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        sx={mergedSx}
      >
        {cardContent}
      </MotionBaseCard>
    );
  }

  return (
    <BaseCard interactive={Boolean(onClick)} onClick={onClick} sx={mergedSx}>
      {cardContent}
    </BaseCard>
  );
}
