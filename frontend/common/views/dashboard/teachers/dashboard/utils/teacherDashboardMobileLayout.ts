import type { SxProps, Theme } from "@mui/material/styles";

/** Fixed vertical rhythm between top-level page sections (mobile + desktop). */
export const teacherDashboardPageContainerSx: SxProps<Theme> = theme => ({
  gap: theme.layout.sectionGap,
});
