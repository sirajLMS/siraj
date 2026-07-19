"use client";

import { Paper, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

export interface MobileCardListItemProps {
  readonly children: ReactNode;
  readonly variant?: "edge-to-edge" | "rounded";
  readonly dimmed?: boolean;
  readonly dimmedOpacity?: number;
  readonly accentBorder?: {
    readonly color: "primary" | "info" | "error" | "warning";
    readonly side: "inline-start" | "inline-end" | "top" | "bottom";
    readonly width?: number;
  };
  readonly interactive?: boolean;
  readonly sx?: SxProps<Theme>;
}

function getAccentColor(color: "primary" | "info" | "error" | "warning", theme: Theme) {
  switch (color) {
    case "primary":
      return theme.palette.primary.main;
    case "info":
      return theme.palette.info.main;
    case "error":
      return theme.palette.error.main;
    case "warning":
      return theme.palette.warning.main;
  }
}

export function MobileCardListItem({
  children,
  variant = "edge-to-edge",
  dimmed = false,
  dimmedOpacity,
  accentBorder,
  interactive = false,
  sx,
}: MobileCardListItemProps) {
  const isEdgeToEdge = variant === "edge-to-edge";

  const accentBorderSx = accentBorder
    ? (theme: Theme) => {
        const color = getAccentColor(accentBorder.color, theme);
        const side = accentBorder.side;
        const width = accentBorder.width ?? 4;
        return { [side]: `${width}px solid ${color}` };
      }
    : undefined;

  const baseSx: SxProps<Theme> = (theme: Theme) => ({
    padding: isEdgeToEdge ? theme.spacing(2) : theme.spacing(2.5),
    borderRadius: 0,
    boxShadow: isEdgeToEdge ? "none" : theme.shadows[1],
    backgroundColor: isEdgeToEdge ? theme.palette.surfaceContainerLowest : theme.palette.background.paper,
    border: isEdgeToEdge ? "none" : `1px solid ${theme.palette.divider}`,
    opacity: dimmed ? (dimmedOpacity ?? 0.85) : 1,
    transition: interactive ? "transform 0.15s ease, box-shadow 0.15s ease" : "none",
    ...(interactive ? { cursor: "pointer" } : {}),
    ...(accentBorderSx ? accentBorderSx(theme) : {}),
  });

  const interactiveSx: SxProps<Theme> = interactive
    ? (theme: Theme) => ({
        "&:active": {
          transform: "scale(0.98)",
          boxShadow: isEdgeToEdge ? "none" : theme.shadows[2],
        },
        "&:hover": {
          boxShadow: isEdgeToEdge ? "none" : theme.shadows[3],
        },
      })
    : () => ({});

  return (
    <Paper elevation={0} sx={{ ...baseSx, ...interactiveSx, ...sx }}>
      {children}
    </Paper>
  );
}
