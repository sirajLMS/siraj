import type { SxProps, Theme } from "@mui/material/styles";
import { MOBILE_TABLET_MAX_BREAKPOINT } from "@/frontend/common/utils/sx/edgeToEdgeSx";

/** Horizontal content inset in theme spacing units (matches scroll-row / header gutter). */
export const MOBILE_CONTENT_GUTTER = 2;

/**
 * Horizontal inset for mobile page content.
 * Use on text, toolbars, section titles, and controls when the shell is edge-to-edge (`px: 0`).
 * Do not wrap horizontal scroll rows — they own their own peek-scroll padding.
 */
export const mobileContentGutterSx: SxProps<Theme> = theme => ({
  paddingInline: theme.spacing(MOBILE_CONTENT_GUTTER),
});

/** Same gutter, only below `md` — for shared components that also render on desktop. */
export const mobileContentGutterBelowMdSx: SxProps<Theme> = theme => ({
  [theme.breakpoints.down("md")]: {
    paddingInline: theme.spacing(MOBILE_CONTENT_GUTTER),
  },
});

/** Same gutter, only below `lg` — tablet-inclusive shared layouts. */
export const mobileContentGutterBelowLgSx: SxProps<Theme> = theme => ({
  [theme.breakpoints.down(MOBILE_TABLET_MAX_BREAKPOINT)]: {
    paddingInline: theme.spacing(MOBILE_CONTENT_GUTTER),
  },
});
