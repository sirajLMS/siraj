"use client";

import type { ReactNode } from "react";
import { StatusBadgeShared } from "@/frontend/common/components/ui/badge/StatusBadgeShared";
import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";

export type { StatusBadgeCategory };

export interface DesktopStatusBadgeProps {
  readonly category: StatusBadgeCategory;
  readonly status: string;
  readonly label: string;
  readonly size?: "small" | "medium";
  readonly icon?: ReactNode;
}

/**
 * Desktop status badge. Defaults to `small` size and renders either as a
 * Chip (with optional icon) or as a `Box`-backed label. Typography uses the
 * theme `labelUppercase` variant.
 */
export function DesktopStatusBadge({
  category,
  status,
  label,
  size = "small",
  icon,
}: Readonly<DesktopStatusBadgeProps>) {
  return (
    <StatusBadgeShared
      category={category}
      status={status}
      label={label}
      size={size}
      icon={icon}
      chipDimensions={{
        small: { height: 24 },
        medium: { height: 28 },
      }}
      boxPadding={() => ({ px: 1.5, py: 0.5 })}
    />
  );
}
