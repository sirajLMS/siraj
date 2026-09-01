"use client";

import type { ReactNode } from "react";
import { StatusBadgeShared } from "@/frontend/common/components/ui/badge/StatusBadgeShared";
import type {
  StatusBadgeCategory,
  StatusBadgeSharedProps,
  StatusBadgeSlotProps,
} from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";

type MobileStatusBadgeCategory = StatusBadgeCategory;

export interface MobileStatusBadgeProps {
  readonly category: MobileStatusBadgeCategory;
  readonly status: string;
  readonly label: string;
  readonly size?: "small" | "medium";
  readonly typographyVariant?: "labelUppercase" | "labelSm";
  readonly icon?: ReactNode;
  readonly component?: "output";
}

/**
 * Mobile status badge. Compact variant tuned for mobile screens —
 * tighter horizontal padding, smaller Chip heights (20/24 vs desktop's
 * 24/28), and a smaller typography size pill so badges stay legible in
 * dense card lists without taking too much vertical space.
 *
 * Consumes the shared `StatusBadgeShared` scaffold for color resolution
 * and structure, passing mobile-specific dimensions and typography via
 * slot props.
 */
export function MobileStatusBadge({
  category,
  status,
  label,
  size = "small",
  typographyVariant = "labelUppercase",
  icon,
  component,
}: Readonly<MobileStatusBadgeProps>) {
  const chipHeight = size === "small" ? 20 : 24;
  const chipMinWidth = size === "small" ? 72 : 84;
  const chipFontSize = typographyVariant === "labelSm" ? undefined : "0.7rem";

  const sharedProps: StatusBadgeSharedProps = {
    category,
    status,
    label,
    size,
    icon,
    component,
  };

  const slotProps: StatusBadgeSlotProps = {
    chipDimensions: {
      small: { height: chipHeight, minWidth: chipMinWidth },
      medium: { height: chipHeight, minWidth: chipMinWidth },
    },
    typographyProps: {
      variant: typographyVariant === "labelSm" ? "labelSm" : "labelUppercase",
      fontSize: chipFontSize,
      textTransform: typographyVariant === "labelUppercase" ? "uppercase" : undefined,
    },
    boxPadding: theme => ({
      minWidth: chipMinWidth,
      paddingInline: theme.spacing(1),
      py: 0.25,
    }),
  };

  return <StatusBadgeShared {...sharedProps} {...slotProps} />;
}
