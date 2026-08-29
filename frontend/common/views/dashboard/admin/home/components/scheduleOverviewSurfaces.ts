import type { Theme } from "@mui/material";
import type { SystemStyleObject } from "@mui/system";

type ThemeStyleFn = (theme: Theme) => SystemStyleObject<Theme>;

/** Filter / toolbar band beneath the section title. */
export const scheduleOverviewFilterBarSx: ThemeStyleFn = theme => ({
  backgroundColor: theme.palette.surfaceContainerLow,
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
});

/** Canvas behind the schedule card list. */
export const scheduleOverviewListCanvasSx: ThemeStyleFn = theme => ({
  backgroundColor: theme.palette.surface,
});

/** Desktop card shell and mobile list-item surface. */
export const scheduleOverviewCardShellSx: ThemeStyleFn = theme => ({
  backgroundColor: theme.palette.surfaceContainer,
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
});

/** Pagination footer band. */
export const scheduleOverviewPaginationSurfaceSx: ThemeStyleFn = theme => ({
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLow,
});
