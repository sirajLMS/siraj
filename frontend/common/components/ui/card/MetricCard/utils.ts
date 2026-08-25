import type { Theme } from "@mui/material";
import { alpha } from "@mui/material/styles";

export type MetricCardVariant = "default" | "error" | "highlight" | "danger";
export type MetricCardDensity = "default" | "compact";

export function formatValue(value: number | string): string {
  if (typeof value === "number") {
    return String(value);
  }
  return value;
}

export function valueColor({ variant, theme }: { variant: MetricCardVariant; theme: Theme }) {
  switch (variant) {
    case "error":
      return theme.palette.error.main;
    case "highlight":
      return theme.palette.primary.light;
    case "danger":
      return theme.palette.error.main;
    case "default":
      return theme.palette.primary.main;
  }
  throw new Error("Unhandled variant in valueColor");
}

export function filledIconWrapSx(theme: Theme, isError: boolean) {
  return {
    backgroundColor: isError ? theme.palette.error.main : theme.palette.primary.main,
    borderColor: isError ? theme.palette.error.main : theme.palette.primary.main,
    "& .MuiSvgIcon-root": { color: isError ? theme.palette.onError : theme.palette.onPrimary },
  };
}

/**
 * Soft tinted background for the icon wrap in its default (non-highlight,
 * non-error) state — gives the icon a subtle colored "chip" appearance instead
 * of a bare bordered circle. Uses alpha() so it adapts to light/dark themes.
 */
export function tintedIconWrapSx(theme: Theme, isError: boolean) {
  if (isError) {
    return {
      backgroundColor: alpha(theme.palette.error.main, 0.12),
    };
  }
  return {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  };
}

export function interactiveIconHoverSx(theme: Theme, isError: boolean) {
  return {
    ...filledIconWrapSx(theme, isError),
    transform: "scale(1.1)",
  };
}

export function interactiveIconActiveSx(theme: Theme, isError: boolean) {
  return {
    ...filledIconWrapSx(theme, isError),
    transform: "scale(0.95)",
  };
}

/**
 * Shared visual-feedback styles for the MetricCard chrome: hover ring, highlight,
 * error border, icon wrap hover/active emphasis, and border radius. Used by both
 * the common (horizontal row) and mobile (compact column) StyledCard variants to
 * avoid duplicating these blocks across tiers.
 *
 * Enhancements: subtle lift on hover (translateY) + a gradient ring glow on the
 * highlight state.
 */
export function cardFeedbackSx(theme: Theme, isHighlight: boolean, isError: boolean) {
  return {
    "&:hover": {
      borderColor: theme.palette.primary.main,
      boxShadow: theme.palette.shadow.cardHover,
      transform: "translateY(-2px)",
    },
    ...(isHighlight && {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
    }),
    ...(isError && {
      borderColor: theme.palette.error.light,
    }),
    "&:hover .metric-icon-wrap": interactiveIconHoverSx(theme, isError),
    "&:active .metric-icon-wrap": interactiveIconActiveSx(theme, isError),
    borderRadius: theme.layout.radius.card,
  };
}
