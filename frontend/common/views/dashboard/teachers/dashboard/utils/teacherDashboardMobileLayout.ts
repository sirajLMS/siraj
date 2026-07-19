import type { SxProps, Theme } from "@mui/material/styles";
import { mobileContentGutterBelowMdSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";

/** Horizontal inset for page sections on mobile — page itself has px: 0 in DashboardLayout. */
export const teacherDashboardContentPaddingSx: SxProps<Theme> = mobileContentGutterBelowMdSx;

/** Fixed vertical rhythm between top-level page sections (mobile + desktop). */
export const teacherDashboardPageContainerSx: SxProps<Theme> = theme => ({
  gap: theme.layout.sectionGap,
});
