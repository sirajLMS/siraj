import type { Theme } from "@mui/material/styles";
import type {
  ResolveStatusPaletteKeyFn,
  StatusBadgeCategory,
  StatusPaletteKey,
} from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";

/**
 * Safely retrieves a string value from `theme.palette.status` by key.
 *
 * Uses dynamic key access with a runtime type guard to avoid unsafe
 * template-literal type assertions.
 */
export function getStatusPaletteEntry(theme: Theme, key: string): string {
  const value = Reflect.get(theme.palette.status, key);
  return typeof value === "string" ? value : "";
}

/**
 * Maps every category's raw status values to a semantic palette key.
 *
 * Categories that are absent from this map have no palette-key mapping and are
 * resolved by the category-specific color resolvers instead.
 */
const STATUS_PALETTE_KEY_MAPS: Partial<Record<StatusBadgeCategory, Record<string, StatusPaletteKey>>> = {
  classSession: {
    active: "active",
    upcoming: "pending",
    missed: "blocked",
    late: "confirmed",
    hold: "blocked",
  },
  classStatus: {
    scheduled: "confirmed",
    in_progress: "active",
    pending: "pending",
    completed: "completed",
    cancelled: "cancelled",
    absent: "blocked",
  },
  classInstance: {
    PENDING: "pending",
    NOT_ACTIVATED: "pending",
    ACTIVATED: "active",
    RUNNING: "active",
    TAKEN: "completed",
    COMPLETED: "completed",
    ABSENT: "blocked",
    LEAVE: "cancelled",
  },
  sessionTracking: {
    regular: "active",
    suspended_pending: "blocked",
    pending_verification: "pending",
    PRESENT: "active",
    ABSENT: "blocked",
    PENDING: "pending",
    LATE: "pending",
  },
  trackingStatus: {
    rescheduled: "active",
    pending_leave: "pending",
  },
  invoice: {
    PAID: "completed",
    PENDING: "pending",
    UNPAID: "pending",
    OVERDUE: "blocked",
    PAYMENT_PENDING: "confirmed",
  },
  paymentMethod: {
    active: "active",
    inactive: "cancelled",
    verified: "confirmed",
    unverified: "pending",
  },
  syncStatus: {
    success: "completed",
    running: "pending",
    partial: "confirmed",
    failed: "blocked",
    unknown: "pending",
  },
  quotaStatus: {
    ACTIVE: "active",
    EXPIRED: "completed",
    ARCHIVED: "blocked",
    PENDING: "pending",
  },
  cronRunStatus: {
    COMPLETED: "completed",
    PENDING: "pending",
    RUNNING: "pending",
    FAILED: "blocked",
    TIMEOUT: "blocked",
    CANCELLED: "cancelled",
    RETRYING: "pending",
  },
  cronScheduleStatus: {
    ACTIVE: "active",
    PAUSED: "pending",
    DISABLED: "cancelled",
  },
  overrideStatus: {
    conflict: "blocked",
    healthy: "active",
  },
  groupType: {
    system: "confirmed",
    custom: "pending",
  },
  requestStatus: {
    PENDING: "pending",
    APPROVED: "confirmed",
    REJECTED: "blocked",
    RESCHEDULED: "confirmed",
    CANCELLED: "cancelled",
  },
  sessionAudit: {
    open: "confirmed",
    end: "completed",
    Absent: "blocked",
    absent_student: "pending",
  },
  creditTransaction: {
    PURCHASE: "active",
    DEDUCTION: "cancelled",
    REFUND: "confirmed",
    ADJUSTMENT: "pending",
  },
};

/**
 * Resolves a (category, status) pair to a semantic palette key.
 *
 * Returns `null` when the category has no palette-key mapping at all. Within a
 * mapped category, an unrecognized status falls back to `"pending"`.
 */
export const resolveStatusPaletteKey: ResolveStatusPaletteKeyFn = (category, status) => {
  const map = STATUS_PALETTE_KEY_MAPS[category];
  if (!map) {
    return null;
  }
  return map[status] ?? "pending";
};
