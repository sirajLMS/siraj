"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Box, type SxProps, type Theme, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { BaseCard } from "./BaseCard";
import { mergeSx } from "./mergeSx";

export type MetricCardVariant = "default" | "error" | "highlight" | "danger" | "compact";
export type MetricCardSize = "default" | "compact";

interface MetricCardProps {
  readonly icon: SvgIconComponent;
  readonly label: string;
  readonly value: number | string;
  readonly variant?: MetricCardVariant;
  readonly size?: MetricCardSize;
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

function filledIconWrapSx(theme: Theme, isError: boolean) {
  return {
    backgroundColor: isError ? theme.palette.error.main : theme.palette.primary.main,
    borderColor: isError ? theme.palette.error.main : theme.palette.primary.main,
    "& .MuiSvgIcon-root": { color: isError ? theme.palette.onError : theme.palette.onPrimary },
  };
}

function interactiveIconHoverSx(theme: Theme, isError: boolean) {
  return {
    ...filledIconWrapSx(theme, isError),
    transform: "scale(1.1)",
  };
}

function interactiveIconActiveSx(theme: Theme, isError: boolean) {
  return {
    ...filledIconWrapSx(theme, isError),
    transform: "scale(0.95)",
  };
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  size = "default",
  subLabel,
  animated = true,
  animationIndex = 0,
  onClick,
  sx,
}: MetricCardProps) {
  const isError = variant === "error" || variant === "danger";
  const isHighlight = variant === "highlight";
  const isCompactVariant = variant === "compact";
  const isCompactSize = size === "compact" || isCompactVariant;
  const iconSize = isCompactSize ? 32 : 44;
  const iconFontSize = isCompactSize ? 18 : 22;

  const labelTypography = (
    <Typography
      variant="labelUppercase"
      title={label}
      sx={theme => ({
        color: isError ? theme.palette.error.main : theme.palette.primary.main,
        mb: isCompactSize ? 0 : 0.5,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      })}
    >
      {label}
    </Typography>
  );

  const valueTypography = (
    <Typography
      variant={isCompactSize ? "headlineMd" : "headlineLg"}
      sx={theme => ({
        fontWeight: 700,
        color: valueColor({ variant: variant === "compact" ? "default" : variant, theme }),
        lineHeight: 1,
      })}
    >
      {formatValue(value)}
    </Typography>
  );

  const iconWrap = (
    <Box
      className="metric-icon-wrap"
      sx={theme => ({
        width: iconSize,
        height: iconSize,
        borderRadius: "50%",
        border: "2px solid",
        borderColor: isError ? theme.palette.error.main : theme.palette.primary.main,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition:
          "background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, color 0.2s ease",
        ...(isHighlight && filledIconWrapSx(theme, isError)),
      })}
    >
      <Icon
        sx={theme => ({
          fontSize: iconFontSize,
          color: isError ? theme.palette.error.main : theme.palette.primary.main,
          transition: "color 0.2s ease",
        })}
      />
    </Box>
  );

  const cardContent = isCompactSize ? (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 1.25,
        height: "100%",
        minWidth: 0,
      }}
    >
      {labelTypography}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>{valueTypography}</Box>
        {iconWrap}
      </Box>
      {subLabel ? (
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.dark })}>
          {subLabel}
        </Typography>
      ) : null}
    </Box>
  ) : (
    <>
      <Box
        sx={{
          ml: 0.5,
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          height: "100%",
        }}
      >
        {labelTypography}
        {valueTypography}
        {subLabel ? (
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.dark, mt: 0.5 })}>
            {subLabel}
          </Typography>
        ) : null}
      </Box>
      {iconWrap}
    </>
  );

  const cardSx = (theme: Theme) => ({
    p: isCompactSize ? 1.5 : 2.5,
    display: "flex",
    flexDirection: isCompactSize ? "column" : "row",
    alignItems: isCompactSize ? "stretch" : "center",
    justifyContent: isCompactSize ? "flex-start" : "space-between",
    gap: 1,
    height: "100%",
    minHeight: isCompactSize ? 92 : undefined,
    overflow: "hidden",
    ...(isHighlight && {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
    }),
    ...(isError && {
      borderColor: theme.palette.error.light,
    }),
    "&:hover .metric-icon-wrap": onClick ? interactiveIconHoverSx(theme, isError) : undefined,
    "&:active .metric-icon-wrap": onClick ? interactiveIconActiveSx(theme, isError) : undefined,
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
