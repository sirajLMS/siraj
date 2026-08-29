import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

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
  | "syncStatus"
  | "quotaStatus"
  | "cronRunStatus"
  | "cronScheduleStatus"
  | "overrideStatus"
  | "groupType"
  | "creditTransaction";

export type StatusPaletteKey = "active" | "pending" | "blocked" | "confirmed" | "completed" | "cancelled";

export interface StatusBadgeSharedProps {
  readonly category: StatusBadgeCategory;
  readonly status: string;
  readonly label: string;
  readonly size?: "small" | "medium";
  readonly icon?: ReactNode;
  readonly component?: "output";
}

/**
 * Slot props that each tier provides to customize the scaffold's rendering.
 *
 * - `chipDimensions` — per-size height and minWidth for the Chip variant
 * - `chipPaddingInline` — horizontal padding for the Chip variant
 * - `boxPadding` — padding for the Box (non-icon) variant
 * - `typographyProps` — variant and optional font-size / text-transform overrides
 */
export interface StatusBadgeSlotProps {
  readonly chipDimensions?: {
    readonly small: { readonly height: number; readonly minWidth?: number };
    readonly medium: { readonly height: number; readonly minWidth?: number };
  };
  readonly chipPaddingInline?: (theme: Theme) => string;
  readonly boxPadding?: (theme: Theme) => Record<string, unknown> | undefined;
  readonly typographyProps?: {
    readonly variant?: "labelUppercase" | "labelSm";
    readonly fontSize?: string;
    readonly textTransform?: "uppercase" | "none";
  };
}

/**
 * Resolves a (category, status) pair to a semantic palette key.
 *
 * Exported so tier components can reuse the logic without duplicating it.
 */
export type ResolveStatusPaletteKeyFn = (category: StatusBadgeCategory, status: string) => StatusPaletteKey | null;

/**
 * Returns `{ backgroundColor, color }` for a given theme + category + status.
 *
 * Exported so tier components can reuse the logic without duplicating it.
 */
export type GetStatusColorsFn = (
  theme: Theme,
  category: StatusBadgeCategory,
  status: string
) => { backgroundColor: string; color: string };
