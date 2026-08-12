import type { Theme } from "@mui/material";

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
 */
export function cardFeedbackSx(theme: Theme, isHighlight: boolean, isError: boolean) {
  return {
    "&:hover": {
      borderColor: theme.palette.primary.main,
      boxShadow: theme.palette.shadow.cardHover,
    },
    ...(isHighlight && {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
    }),
    ...(isError && {
      borderColor: theme.palette.error.light,
    }),
    "&:hover .metric-icon-wrap": interactiveIconHoverSx(theme, isError),
    "&:active .metric-icon-wrap": interactiveIconActiveSx(theme, isError),
    borderRadius: theme.layout.radius.card,
  };
}
