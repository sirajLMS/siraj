"use client";

import { Paper, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { MOBILE_CONTENT_GUTTER } from "@/frontend/common/utils/sx/mobileContentGutterSx";

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
  throw new Error(`Unhandled case in getAccentColor`);
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
        const width = accentBorder.width ?? 4;
        switch (accentBorder.side) {
          case "inline-start":
            return { borderInlineStart: `${width}px solid ${color}` };
          case "inline-end":
            return { borderInlineEnd: `${width}px solid ${color}` };
          case "top":
            return { borderTop: `${width}px solid ${color}` };
          case "bottom":
            return { borderBottom: `${width}px solid ${color}` };
        }
        throw new Error(`Unhandled case in unknown`);
      }
    : undefined;

  const baseSx: SxProps<Theme> = (theme: Theme) => ({
    ...(isEdgeToEdge
      ? { paddingInline: theme.spacing(MOBILE_CONTENT_GUTTER), paddingBlock: theme.spacing(2) }
      : { padding: theme.spacing(2.5) }),
    borderRadius: isEdgeToEdge ? 0 : theme.layout.radius.card,
    boxShadow: isEdgeToEdge ? "none" : theme.shadows[1],
    backgroundColor: isEdgeToEdge ? theme.palette.surfaceContainerLowest : theme.palette.background.paper,
    borderTop: isEdgeToEdge ? "none" : `1px solid ${theme.palette.border.light}`,
    borderBottom: `1px solid ${theme.palette.outlineVariant}`,
    borderLeft: isEdgeToEdge ? "none" : `1px solid ${theme.palette.border.light}`,
    borderRight: isEdgeToEdge ? "none" : `1px solid ${theme.palette.border.light}`,
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

  const sxArray = Array.isArray(sx) ? sx : sx ? [sx] : [];

  return (
    <Paper elevation={0} sx={[baseSx, interactiveSx, ...sxArray]}>
      {children}
    </Paper>
  );
}
