"use client";

import { Box, Chip, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactElement, ReactNode } from "react";

export type MobileStatusBadgeCategory =
  | "studentAccount"
  | "staffAccount"
  | "session"
  | "enrollment"
  | "classSession"
  | "classStatus"
  | "classInstance"
  | "sessionTracking"
  | "trackingStatus"
  | "invoice"
  | "paymentMethod"
  | "syncStatus";

export interface MobileStatusBadgeProps {
  readonly category: MobileStatusBadgeCategory;
  readonly status: string;
  readonly label: string;
  readonly size?: "small" | "medium";
  readonly typographyVariant?: "labelUppercase" | "labelSm";
  readonly icon?: ReactNode;
}

function resolveStatusPaletteKey(
  category: MobileStatusBadgeCategory,
  status: string
): "active" | "pending" | "blocked" | "confirmed" | "completed" | "cancelled" | null {
  switch (category) {
    case "classSession": {
      const map: Record<string, "active" | "pending" | "blocked" | "confirmed"> = {
        active: "active",
        upcoming: "pending",
        missed: "blocked",
        late: "confirmed",
        hold: "blocked",
      };
      return map[status] ?? "pending";
    }
    case "classStatus": {
      const map: Record<string, "confirmed" | "active" | "pending" | "completed" | "cancelled" | "blocked"> = {
        scheduled: "confirmed",
        in_progress: "active",
        pending: "pending",
        completed: "completed",
        cancelled: "cancelled",
        absent: "blocked",
      };
      return map[status] ?? "pending";
    }
    case "classInstance": {
      const map: Record<string, "active" | "pending" | "completed" | "cancelled" | "blocked"> = {
        PENDING: "pending",
        NOT_ACTIVATED: "pending",
        ACTIVATED: "active",
        RUNNING: "active",
        TAKEN: "completed",
        COMPLETED: "completed",
        ABSENT: "blocked",
        LEAVE: "cancelled",
      };
      return map[status] ?? "pending";
    }
    case "sessionTracking": {
      const map: Record<string, "active" | "blocked" | "pending"> = {
        regular: "active",
        suspended_pending: "blocked",
        pending_verification: "pending",
      };
      return map[status] ?? "pending";
    }
    case "trackingStatus": {
      const map: Record<string, "active" | "pending"> = {
        rescheduled: "active",
        pending_leave: "pending",
      };
      return map[status] ?? "pending";
    }
    case "invoice": {
      const map: Record<string, "completed" | "pending" | "blocked" | "confirmed"> = {
        PAID: "completed",
        PENDING: "pending",
        UNPAID: "pending",
        OVERDUE: "blocked",
        PAYMENT_PENDING: "confirmed",
      };
      return map[status] ?? "pending";
    }
    case "paymentMethod": {
      const map: Record<string, "active" | "pending" | "confirmed" | "cancelled"> = {
        active: "active",
        inactive: "cancelled",
        verified: "confirmed",
        unverified: "pending",
      };
      return map[status] ?? "pending";
    }
    case "syncStatus": {
      const map: Record<string, "completed" | "pending" | "blocked" | "confirmed"> = {
        success: "completed",
        running: "pending",
        partial: "confirmed",
        failed: "blocked",
        unknown: "pending",
      };
      return map[status] ?? "pending";
    }
    default:
      return null;
  }
}

function getStatusColors(theme: Theme, category: MobileStatusBadgeCategory, status: string) {
  if (category === "sessionTracking" && status === "on_leave") {
    return {
      backgroundColor: theme.palette.secondaryContainer,
      color: theme.palette.onSecondaryContainer,
    };
  }

  const paletteKey = resolveStatusPaletteKey(category, status);
  if (paletteKey) {
    const containerKey = `${paletteKey}Container` as keyof typeof theme.palette.status;
    const onContainerKey =
      `on${paletteKey.charAt(0).toUpperCase()}${paletteKey.slice(1)}Container` as keyof typeof theme.palette.status;

    return {
      backgroundColor: theme.palette.status[containerKey],
      color: theme.palette.status[onContainerKey],
    };
  }

  switch (category) {
    case "studentAccount": {
      const map: Record<string, { backgroundColor: string; color: string }> = {
        regular: {
          backgroundColor: theme.palette.status.activeContainer,
          color: theme.palette.status.onActiveContainer,
        },
        deactivated: {
          backgroundColor: theme.palette.status.cancelledContainer,
          color: theme.palette.status.onCancelledContainer,
        },
        suspended: {
          backgroundColor: theme.palette.status.blockedContainer,
          color: theme.palette.status.onBlockedContainer,
        },
        on_leave: { backgroundColor: theme.palette.secondaryContainer, color: theme.palette.onSecondaryContainer },
        on_trial: {
          backgroundColor: theme.palette.status.pendingContainer,
          color: theme.palette.status.onPendingContainer,
        },
      };
      return (
        map[status] ?? { backgroundColor: theme.palette.surfaceContainerHigh, color: theme.palette.onSurfaceVariant }
      );
    }
    case "staffAccount": {
      const map: Record<string, { backgroundColor: string; color: string }> = {
        activated: {
          backgroundColor: theme.palette.status.activeContainer,
          color: theme.palette.status.onActiveContainer,
        },
        deactivated: {
          backgroundColor: theme.palette.status.cancelledContainer,
          color: theme.palette.status.onCancelledContainer,
        },
      };
      return (
        map[status] ?? { backgroundColor: theme.palette.surfaceContainerHigh, color: theme.palette.onSurfaceVariant }
      );
    }
    case "session": {
      const allowedStatuses = ["active", "pending", "blocked", "confirmed", "completed", "cancelled"] as const;
      type SessionStatus = (typeof allowedStatuses)[number];
      const isSessionStatus = (value: string): value is SessionStatus =>
        (allowedStatuses as readonly string[]).includes(value);
      const key: SessionStatus = isSessionStatus(status) ? status : "pending";
      const containerKey = `${key}Container` as keyof typeof theme.palette.status;
      const onContainerKey =
        `on${key.charAt(0).toUpperCase()}${key.slice(1)}Container` as keyof typeof theme.palette.status;

      if (theme.palette.status[containerKey]) {
        return {
          backgroundColor: theme.palette.status[containerKey],
          color: theme.palette.status[onContainerKey],
        };
      }
      return { backgroundColor: theme.palette.surfaceContainerHigh, color: theme.palette.onSurfaceVariant };
    }
    case "enrollment": {
      const map: Record<string, { backgroundColor: string; color: string }> = {
        regular: {
          backgroundColor: theme.palette.status.activeContainer,
          color: theme.palette.status.onActiveContainer,
        },
        prospect: {
          backgroundColor: theme.palette.status.pendingContainer,
          color: theme.palette.status.onPendingContainer,
        },
        withdrawn: {
          backgroundColor: theme.palette.status.cancelledContainer,
          color: theme.palette.status.onCancelledContainer,
        },
      };
      return (
        map[status] ?? { backgroundColor: theme.palette.surfaceContainerHigh, color: theme.palette.onSurfaceVariant }
      );
    }
    default:
      return { backgroundColor: theme.palette.surfaceContainerHigh, color: theme.palette.onSurfaceVariant };
  }
}

/**
 * Mobile status badge. Compact variant tuned for mobile screens —
 * tighter horizontal padding, smaller Chip heights (20/24 vs desktop's
 * 24/28), and a smaller typography size pill so badges stay legible in
 * dense card lists without taking too much vertical space.
 */
export function MobileStatusBadge({
  category,
  status,
  label,
  size = "small",
  typographyVariant = "labelUppercase",
  icon,
}: Readonly<MobileStatusBadgeProps>) {
  const chipHeight = size === "small" ? 20 : 24;
  const chipMinWidth = size === "small" ? 72 : 84;
  const chipTypography = typographyVariant === "labelSm" ? "labelSm" : "labelUppercase";
  const chipFontSize = typographyVariant === "labelSm" ? undefined : "0.7rem";

  if (icon) {
    return (
      <Chip
        icon={icon as ReactElement}
        label={label}
        size={size}
        sx={theme => {
          const { backgroundColor, color } = getStatusColors(theme, category, status);
          const typography =
            typographyVariant === "labelSm" ? theme.typography.labelSm : theme.typography.labelUppercase;
          return {
            backgroundColor,
            color,
            whiteSpace: "normal",
            overflowWrap: "break-word",
            fontFamily: typography.fontFamily,
            fontSize: chipFontSize ?? typography.fontSize,
            fontWeight: typography.fontWeight,
            letterSpacing: typography.letterSpacing,
            textTransform: typographyVariant === "labelUppercase" ? "uppercase" : undefined,
            borderRadius: theme.layout.radius.badge,
            height: chipHeight,
            minWidth: chipMinWidth,
            paddingInline: theme.spacing(0.5),
            "& .MuiChip-icon": { color },
          };
        }}
      />
    );
  }

  return (
    <Box
      component="span"
      sx={theme => {
        const { backgroundColor, color } = getStatusColors(theme, category, status);
        return {
          display: "inline-flex",
          alignItems: "center",
          minWidth: chipMinWidth,
          paddingInline: theme.spacing(1),
          py: 0.25,
          borderRadius: theme.layout.radius.badge,
          backgroundColor,
          color,
        };
      }}
    >
      <Typography
        variant={chipTypography}
        sx={{
          lineHeight: 1,
          ...(chipFontSize ? { fontSize: chipFontSize } : {}),
          ...(typographyVariant === "labelUppercase" ? { textTransform: "uppercase" } : {}),
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
