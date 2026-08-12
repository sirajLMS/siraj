import { alpha } from "@mui/material";
import type { Theme } from "@mui/material/styles";

export function getWarningColor(theme: Theme): string {
  return theme.palette.warning.main;
}

export function getOnWarningColor(theme: Theme): string {
  return theme.palette.onWarning;
}

export function getWarningHeaderAlpha(theme: Theme): string {
  return alpha(theme.palette.warning.main, 0.1);
}

export function getWarningTitleColor(theme: Theme): string {
  return theme.palette.warning.dark;
}

export function getSuccessColor(theme: Theme): string {
  return theme.palette.success.main;
}

export function getOnSuccessColor(theme: Theme): string {
  return theme.palette.onSuccess;
}

export function getSuccessHeaderAlpha(theme: Theme): string {
  return alpha(theme.palette.success.main, 0.08);
}

export function getSuccessTitleColor(theme: Theme): string {
  return theme.palette.primary.main;
}
