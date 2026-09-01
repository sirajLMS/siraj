"use client";

import { Box, Chip, Typography } from "@mui/material";
import { isValidElement } from "react";
import { getStatusColors } from "@/frontend/common/components/ui/badge/statusBadgeShared.utils";
import type {
  StatusBadgeSharedProps,
  StatusBadgeSlotProps,
} from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";

export interface StatusBadgeScaffoldProps extends StatusBadgeSharedProps, StatusBadgeSlotProps {}

/**
 * Shared scaffold for status badges across common, desktop, and mobile tiers.
 *
 * Extracts the duplicated color-resolution logic (`resolveStatusPaletteKey`,
 * `getStatusColors`) into a single viewport-agnostic primitive. Tier components
 * pass slot props (`chipSx`, `typographyProps`, `chipDimensions`,
 * `chipPaddingInline`, `boxPadding`) to customize tier-specific rendering while reusing the
 * shared color and type-resolution engine.
 *
 * **MUI v9 compliance:** All styling uses `sx` prop — no direct style props.
 * Icons use `*Outlined` naming convention.
 */
export function StatusBadgeShared({
  category,
  status,
  label,
  size = "small",
  icon,
  typographyProps,
  chipDimensions,
  chipPaddingInline,
  boxPadding,
  component,
}: Readonly<StatusBadgeScaffoldProps>) {
  const dimensions = chipDimensions?.[size] ?? { height: size === "small" ? 24 : 28, minWidth: 72 };

  if (icon && isValidElement(icon)) {
    return (
      <Chip
        icon={icon}
        label={label}
        size={size}
        {...(component ? { component } : {})}
        sx={theme => {
          const { backgroundColor, color } = getStatusColors(theme, category, status);
          const typography =
            typographyProps?.variant === "labelSm" ? theme.typography.labelSm : theme.typography.labelUppercase;
          const base: Record<string, unknown> = {
            backgroundColor,
            color,
            whiteSpace: "normal",
            overflowWrap: "break-word",
            fontFamily: typography.fontFamily,
            fontSize: typographyProps?.fontSize ?? typography.fontSize,
            fontWeight: typography.fontWeight,
            letterSpacing: typography.letterSpacing,
            borderRadius: theme.layout.radius.badge,
            height: dimensions.height,
            paddingInline: chipPaddingInline ? chipPaddingInline(theme) : theme.spacing(0.5),
            transition: theme.transitions.create(["background-color", "color"], { duration: 200, easing: "ease" }),
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
            "& .MuiChip-icon": { color },
          };
          if (dimensions.minWidth !== undefined) {
            base.minWidth = dimensions.minWidth;
          }
          if (typographyProps?.textTransform) {
            base.textTransform = typographyProps.textTransform;
          }
          return base;
        }}
      />
    );
  }

  const variant = typographyProps?.variant ?? "labelUppercase";

  return (
    <Box
      component={component ?? "span"}
      sx={theme => {
        const { backgroundColor, color } = getStatusColors(theme, category, status);
        const base: Record<string, unknown> = {
          display: "inline-flex",
          alignItems: "center",
          borderRadius: theme.layout.radius.badge,
          backgroundColor,
          color,
          transition: theme.transitions.create(["background-color", "color"], { duration: 200, easing: "ease" }),
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        };
        if (dimensions.minWidth !== undefined) {
          base.minWidth = dimensions.minWidth;
        }
        if (boxPadding) {
          const padding = boxPadding(theme);
          if (padding && typeof padding === "object" && !Array.isArray(padding)) {
            Object.assign(base, padding);
          }
        }
        return base;
      }}
    >
      <Typography
        variant={variant}
        sx={{
          lineHeight: 1,
          ...(typographyProps?.fontSize ? { fontSize: typographyProps.fontSize } : {}),
          ...(typographyProps?.textTransform ? { textTransform: typographyProps.textTransform } : {}),
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
