import type { Theme } from "@mui/material";

export type MetricCardVariant = "default" | "error" | "highlight" | "danger" | "compact";
export type MetricCardSize = "default" | "compact";

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
    case "compact":
      return theme.palette.primary.main;
  }
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
