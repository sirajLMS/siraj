import type { SxProps, Theme } from "@mui/material";

/** Filter / toolbar band beneath the section title. */
export const scheduleOverviewFilterBarSx: SxProps<Theme> = theme => ({
  backgroundColor: theme.palette.surfaceContainerLow,
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
});

/** Canvas behind the schedule card list. */
export const scheduleOverviewListCanvasSx: SxProps<Theme> = theme => ({
  backgroundColor: theme.palette.surface,
});

/** Desktop card shell and mobile list-item surface. */
export const scheduleOverviewCardShellSx: SxProps<Theme> = theme => ({
  backgroundColor: theme.palette.surfaceContainer,
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
});

/** Pagination footer band. */
export const scheduleOverviewPaginationSurfaceSx: SxProps<Theme> = theme => ({
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLow,
});

/** Mobile section chrome (title + filters). */
export const scheduleOverviewMobileChromeSx: SxProps<Theme> = theme => ({
  backgroundColor: theme.palette.surfaceContainerLow,
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
});
