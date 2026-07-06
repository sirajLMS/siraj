import type { SxProps, Theme } from "@mui/material/styles";

/** Horizontal inset for page sections on mobile — page itself has px: 0 in DashboardLayout. */
export const teacherDashboardContentPaddingSx: SxProps<Theme> = theme => ({
  [theme.breakpoints.down("md")]: {
    paddingInline: theme.spacing(2),
  },
});

/** Fixed vertical rhythm between top-level page sections (mobile + desktop). */
export const teacherDashboardPageContainerSx: SxProps<Theme> = theme => ({
  gap: theme.layout.sectionGap,
});
