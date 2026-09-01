import type { SxProps, Theme } from "@mui/material/styles";

/** Viewports below `lg` are treated as mobile/tablet for flush full-width panels. */
export const MOBILE_TABLET_MAX_BREAKPOINT = "lg";

const mobileTabletMedia = (theme: Theme) => theme.breakpoints.down(MOBILE_TABLET_MAX_BREAKPOINT);

/** Square corners and no inline borders on mobile/tablet. */
export const edgeToEdgeSx: SxProps<Theme> = theme => ({
  [mobileTabletMedia(theme)]: {
    borderRadius: "0 !important",
    borderInlineStart: "none",
    borderInlineEnd: "none",
    borderLeft: "none",
    borderRight: "none",
  },
});

/** Card flush shell — square corners, no inline borders/shadow. */
export const edgeToEdgeCardShellSx: SxProps<Theme> = theme => ({
  [mobileTabletMedia(theme)]: {
    borderRadius: "0 !important",
    borderInlineStart: "none",
    borderInlineEnd: "none",
    borderLeft: "none",
    borderRight: "none",
    boxShadow: "none",
  },
});

/** Inner padding for simple edge-to-edge cards on mobile/tablet. */
export const edgeToEdgeCardPaddingSx: SxProps<Theme> = theme => ({
  [mobileTabletMedia(theme)]: {
    paddingInline: `${theme.spacing(2)} !important`,
    paddingBlock: theme.spacing(3),
  },
});
