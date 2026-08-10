"use client";

import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

import { StatusBadgeShared } from "@/frontend/common/components/ui/badge/StatusBadgeShared";
import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";

export type { StatusBadgeCategory };

interface StatusBadgeProps {
  readonly category: StatusBadgeCategory;
  readonly status: string;
  readonly label: string;
  readonly size?: "small" | "medium";
  readonly icon?: ReactNode;
}

/**
 * Common (viewport-agnostic) status badge. Delegates rendering to
 * `StatusBadgeShared` with common-tier slot defaults:
 * - Chip height 24/28, minWidth 72, paddingInline `theme.spacing(0.5)`
 * - Box paddingInline `theme.spacing(1.5)`, py 0.5
 * - Typography variant `labelUppercase`, lineHeight 1
 */
export function StatusBadge({ category, status, label, size = "small", icon }: Readonly<StatusBadgeProps>) {
  return (
    <StatusBadgeShared
      category={category}
      status={status}
      label={label}
      size={size}
      icon={icon}
      boxPadding={(theme: Theme) => ({
        paddingInline: theme.spacing(1.5),
        py: 0.5,
      })}
    />
  );
}
