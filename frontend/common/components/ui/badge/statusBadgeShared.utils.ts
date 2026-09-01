"use client";

import type { Theme } from "@mui/material/styles";
import type {
  GetStatusColorsFn,
  ResolveStatusPaletteKeyFn,
  StatusBadgeCategory,
  StatusPaletteKey,
} from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";

/**
 * Safely retrieves a string value from `theme.palette.status` by key.
 *
 * Uses dynamic key access with runtime type guard to avoid unsafe
 * template-literal type assertions.
 */
function getStatusPaletteEntry(theme: Theme, key: string): string {
  const value = Reflect.get(theme.palette.status, key);
  return typeof value === "string" ? value : "";
}

/**
 * Resolves a (category, status) pair to a semantic palette key.
 *
 * Shared across all three tiers — extracted to eliminate the 199-line jscpd clone.
 */
export const resolveStatusPaletteKey: ResolveStatusPaletteKeyFn = (
  category: StatusBadgeCategory,
  status: string
): StatusPaletteKey | null => {
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
        PRESENT: "active",
        ABSENT: "blocked",
        PENDING: "pending",
        LATE: "pending",
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
    case "quotaStatus": {
      const map: Record<string, "active" | "completed" | "blocked" | "pending"> = {
        ACTIVE: "active",
        EXPIRED: "completed",
        ARCHIVED: "blocked",
        PENDING: "pending",
      };
      return map[status] ?? "pending";
    }
    case "cronRunStatus": {
      const map: Record<string, "completed" | "pending" | "blocked" | "cancelled"> = {
        COMPLETED: "completed",
        PENDING: "pending",
        RUNNING: "pending",
        FAILED: "blocked",
        TIMEOUT: "blocked",
        CANCELLED: "cancelled",
        RETRYING: "pending",
      };
      return map[status] ?? "pending";
    }
    case "cronScheduleStatus": {
      const map: Record<string, "active" | "pending" | "cancelled"> = {
        ACTIVE: "active",
        PAUSED: "pending",
        DISABLED: "cancelled",
      };
      return map[status] ?? "pending";
    }
    case "overrideStatus": {
      const map: Record<string, "blocked" | "active"> = {
        conflict: "blocked",
        healthy: "active",
      };
      return map[status] ?? "pending";
    }
    case "groupType": {
      const map: Record<string, "confirmed" | "pending"> = {
        system: "confirmed",
        custom: "pending",
      };
      return map[status] ?? "pending";
    }
    case "creditTransaction": {
      const map: Record<string, "active" | "cancelled" | "confirmed" | "pending"> = {
        PURCHASE: "active",
        DEDUCTION: "cancelled",
        REFUND: "confirmed",
        ADJUSTMENT: "pending",
      };
      return map[status] ?? "pending";
    }
    default:
      return null;
  }
};

/**
 * Returns `{ backgroundColor, color }` for a given theme + category + status.
 *
 * Shared across all three tiers — extracted to eliminate the 199-line jscpd clone.
 */
export const getStatusColors: GetStatusColorsFn = (
  theme: Theme,
  category: StatusBadgeCategory,
  status: string
): { backgroundColor: string; color: string } => {
  if (category === "sessionTracking" && status === "on_leave") {
    return {
      backgroundColor: theme.palette.secondaryContainer,
      color: theme.palette.onSecondaryContainer,
    };
  }

  const paletteKey = resolveStatusPaletteKey(category, status);
  if (paletteKey) {
    const containerKey = getStatusPaletteEntry(theme, `${paletteKey}Container`);
    const onContainerKey = getStatusPaletteEntry(
      theme,
      `on${paletteKey.charAt(0).toUpperCase()}${paletteKey.slice(1)}Container`
    );

    return {
      backgroundColor: containerKey ?? theme.palette.surfaceContainerHigh,
      color: onContainerKey ?? theme.palette.onSurfaceVariant,
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
        on_leave: {
          backgroundColor: theme.palette.secondaryContainer,
          color: theme.palette.onSecondaryContainer,
        },
        on_trial: {
          backgroundColor: theme.palette.status.pendingContainer,
          color: theme.palette.status.onPendingContainer,
        },
      };
      return (
        map[status] ?? {
          backgroundColor: theme.palette.surfaceContainerHigh,
          color: theme.palette.onSurfaceVariant,
        }
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
        map[status] ?? {
          backgroundColor: theme.palette.surfaceContainerHigh,
          color: theme.palette.onSurfaceVariant,
        }
      );
    }
    case "session": {
      const allowedStatuses = ["active", "pending", "blocked", "confirmed", "completed", "cancelled"] as const;
      type SessionStatus = (typeof allowedStatuses)[number];
      const isSessionStatus = (value: string): value is SessionStatus =>
        (allowedStatuses as readonly string[]).includes(value);
      const key: SessionStatus = isSessionStatus(status) ? status : "pending";
      const containerVal = getStatusPaletteEntry(theme, `${key}Container`);

      if (containerVal) {
        return {
          backgroundColor: containerVal,
          color:
            getStatusPaletteEntry(theme, `on${key.charAt(0).toUpperCase()}${key.slice(1)}Container`) ??
            theme.palette.onSurfaceVariant,
        };
      }
      return {
        backgroundColor: theme.palette.surfaceContainerHigh,
        color: theme.palette.onSurfaceVariant,
      };
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
        map[status] ?? {
          backgroundColor: theme.palette.surfaceContainerHigh,
          color: theme.palette.onSurfaceVariant,
        }
      );
    }
    default:
      return {
        backgroundColor: theme.palette.surfaceContainerHigh,
        color: theme.palette.onSurfaceVariant,
      };
  }
};
