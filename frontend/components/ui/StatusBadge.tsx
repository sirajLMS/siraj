"use client";

import { Box, Chip, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactElement, ReactNode } from "react";

/**
 * Status categories supported by the StatusBadge component.
 */
export type StatusBadgeCategory =
  | "studentAccount"
  | "session"
  | "enrollment"
  | "classSession"
  | "classStatus"
  | "sessionTracking"
  | "trackingStatus"
  | "invoice";

interface StatusBadgeProps {
  readonly category: StatusBadgeCategory;
  readonly status: string;
  readonly label: string;
  readonly size?: "small" | "medium";
  readonly icon?: ReactNode;
}

/**
 * Maps category-specific status strings to their corresponding Material 3 status palette base keys.
 */
function resolveStatusPaletteKey(
  category: StatusBadgeCategory,
  status: string
): "active" | "pending" | "blocked" | "confirmed" | "completed" | "cancelled" | null {
  switch (category) {
    case "classSession": {
      const map: Record<string, "active" | "pending" | "blocked"> = {
        active: "active",
        upcoming: "pending",
        missed: "blocked",
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
        paid: "completed",
        pending: "pending",
        unpaid: "pending",
        overdue: "blocked",
      };
      return map[status] ?? "pending";
    }
    default:
      return null;
  }
}

/**
 * Resolves the appropriate Material 3 colors for a given status category.
 * Follows the pattern of using Container colors for badge backgrounds to ensure M3 compliance.
 */
function getStatusColors(theme: Theme, category: StatusBadgeCategory, status: string) {
  // sessionTracking: on_leave uses secondary family
  if (category === "sessionTracking" && status === "on_leave") {
    return {
      bgcolor: theme.palette.secondaryContainer,
      color: theme.palette.onSecondaryContainer,
    };
  }

  const paletteKey = resolveStatusPaletteKey(category, status);
  if (paletteKey) {
    // Dynamically access the M3 container and onContainer colors from the status palette
    const containerKey = `${paletteKey}Container` as keyof typeof theme.palette.status;
    const onContainerKey =
      `on${paletteKey.charAt(0).toUpperCase()}${paletteKey.slice(1)}Container` as keyof typeof theme.palette.status;

    return {
      bgcolor: theme.palette.status[containerKey],
      color: theme.palette.status[onContainerKey],
    };
  }

  switch (category) {
    case "studentAccount": {
      // Map studentAccount statuses to appropriate M3 status families
      const map: Record<string, { bgcolor: string; color: string }> = {
        activated: { bgcolor: theme.palette.status.activeContainer, color: theme.palette.status.onActiveContainer },
        regular: { bgcolor: theme.palette.status.activeContainer, color: theme.palette.status.onActiveContainer },
        deactivated: {
          bgcolor: theme.palette.status.cancelledContainer,
          color: theme.palette.status.onCancelledContainer,
        },
        suspended: { bgcolor: theme.palette.status.blockedContainer, color: theme.palette.status.onBlockedContainer },
        on_leave: { bgcolor: theme.palette.secondaryContainer, color: theme.palette.onSecondaryContainer },
        on_trial: { bgcolor: theme.palette.status.pendingContainer, color: theme.palette.status.onPendingContainer },
      };
      return map[status] ?? { bgcolor: theme.palette.surfaceContainerHigh, color: theme.palette.onSurfaceVariant };
    }
    case "session": {
      // Direct access to status family based on the status string as the key
      const key = status as "active" | "pending" | "blocked" | "confirmed" | "completed" | "cancelled";
      const containerKey = `${key}Container` as keyof typeof theme.palette.status;
      const onContainerKey =
        `on${key.charAt(0).toUpperCase()}${key.slice(1)}Container` as keyof typeof theme.palette.status;

      if (theme.palette.status[containerKey]) {
        return {
          bgcolor: theme.palette.status[containerKey],
          color: theme.palette.status[onContainerKey],
        };
      }
      return { bgcolor: theme.palette.surfaceContainerHigh, color: theme.palette.onSurfaceVariant };
    }
    case "enrollment": {
      // Map enrollment statuses to M3 families
      const map: Record<string, { bgcolor: string; color: string }> = {
        regular: { bgcolor: theme.palette.status.activeContainer, color: theme.palette.status.onActiveContainer },
        prospect: { bgcolor: theme.palette.status.pendingContainer, color: theme.palette.status.onPendingContainer },
        withdrawn: {
          bgcolor: theme.palette.status.cancelledContainer,
          color: theme.palette.status.onCancelledContainer,
        },
      };
      return map[status] ?? { bgcolor: theme.palette.surfaceContainerHigh, color: theme.palette.onSurfaceVariant };
    }
    default:
      return { bgcolor: theme.palette.surfaceContainerHigh, color: theme.palette.onSurfaceVariant };
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
          const { bgcolor, color } = getStatusColors(theme, category, status);
          return {
            bgcolor,
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
        const { bgcolor, color } = getStatusColors(theme, category, status);
        return {
          display: "inline-flex",
          alignItems: "center",
          px: 1.5,
          py: 0.5,
          borderRadius: theme.layout.radius.badge,
          bgcolor,
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
