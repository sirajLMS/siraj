"use client";

import { Box, Chip, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactElement, ReactNode } from "react";

export type StatusBadgeCategory =
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

interface StatusBadgeProps {
  readonly category: StatusBadgeCategory;
  readonly status: string;
  readonly label: string;
  readonly size?: "small" | "medium";
  readonly icon?: ReactNode;
}

function resolveStatusPaletteKey(
  category: StatusBadgeCategory,
  status: string
): "active" | "pending" | "blocked" | "confirmed" | "completed" | "cancelled" | null {
  switch (category) {
    case "classSession": {
      const map: Record<string, "active" | "pending" | "blocked" | "confirmed"> = {
        active: "active",
        upcoming: "pending",
        missed: "blocked",
        late: "confirmed",
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
      const map: Record<string, "completed" | "pending" | "blocked"> = {
        PAID: "completed",
        PENDING: "pending",
        UNPAID: "pending",
        OVERDUE: "blocked",
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

function getStatusColors(theme: Theme, category: StatusBadgeCategory, status: string) {
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
      const key = allowedStatuses.includes(status as any) ? status : "pending";
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

export function StatusBadge({ category, status, label, size = "small", icon }: Readonly<StatusBadgeProps>) {
  if (icon) {
    return (
      <Chip
        icon={icon as ReactElement}
        label={label}
        size={size}
        sx={theme => {
          const { backgroundColor, color } = getStatusColors(theme, category, status);
          return {
            backgroundColor,
            color,
            whiteSpace: "normal",
            overflowWrap: "break-word",
            fontFamily: theme.typography.labelUppercase.fontFamily,
            fontSize: theme.typography.labelUppercase.fontSize,
            fontWeight: theme.typography.labelUppercase.fontWeight,
            letterSpacing: theme.typography.labelUppercase.letterSpacing,
            borderRadius: theme.layout.radius.badge,
            height: size === "small" ? 24 : 28,
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
          px: 1.5,
          py: 0.5,
          borderRadius: theme.layout.radius.badge,
          backgroundColor,
          color,
        };
      }}
    >
      <Typography variant="labelUppercase" sx={{ lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
}
