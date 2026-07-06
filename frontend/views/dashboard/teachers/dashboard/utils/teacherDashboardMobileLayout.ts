import type { SxProps, Theme } from "@mui/material/styles";

/** Horizontal inset for page sections on mobile — page itself has px: 0 in DashboardLayout. */
export const teacherDashboardContentPaddingSx: SxProps<Theme> = theme => ({
  [theme.breakpoints.down("md")]: {
    paddingInline: theme.spacing(2),
  },
});

/** PageContainer gap override: flush sections on mobile, default rhythm on desktop. */
export const teacherDashboardPageContainerSx: SxProps<Theme> = {
  gap: { xs: 0, md: undefined },
};
