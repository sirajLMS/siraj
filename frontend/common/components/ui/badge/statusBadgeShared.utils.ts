"use client";

import type { Theme } from "@mui/material/styles";
import { resolveCategorySpecificColors } from "@/frontend/common/components/ui/badge/statusBadgeShared.categoryColors";
import {
  getStatusPaletteEntry,
  resolveStatusPaletteKey,
} from "@/frontend/common/components/ui/badge/statusBadgeShared.palette";
import type {
  GetStatusColorsFn,
  StatusPaletteKey,
} from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";

function resolvePaletteKeyColors(
  theme: Theme,
  paletteKey: StatusPaletteKey
): { backgroundColor: string; color: string } {
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

/**
 * Returns `{ backgroundColor, color }` for a given theme + category + status.
 *
 * Resolves the semantic palette key first, then falls back to category-specific
 * color resolvers, and finally to neutral surface colors for unmapped
 * combinations. Shared across all viewport tiers.
 */
export const getStatusColors: GetStatusColorsFn = (theme, category, status) => {
  if (category === "sessionTracking" && status === "on_leave") {
    return {
      backgroundColor: theme.palette.secondaryContainer,
      color: theme.palette.onSecondaryContainer,
    };
  }

  const paletteKey = resolveStatusPaletteKey(category, status);
  if (paletteKey) {
    return resolvePaletteKeyColors(theme, paletteKey);
  }

  return resolveCategorySpecificColors(theme, category, status);
};
