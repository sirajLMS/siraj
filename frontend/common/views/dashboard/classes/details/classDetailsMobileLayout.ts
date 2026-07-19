import type { SxProps, Theme } from "@mui/material/styles";
import { MOBILE_TABLET_MAX_BREAKPOINT } from "@/frontend/common/utils/sx/edgeToEdgeSx";
import { mobileContentGutterBelowLgSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";

const mobileTabletMedia = (theme: Theme) => theme.breakpoints.down(MOBILE_TABLET_MAX_BREAKPOINT);

/** Consistent vertical rhythm between page sections on mobile/tablet. */
export const CLASS_DETAILS_MOBILE_SECTION_GAP = 2;

/** Horizontal inset for non-card content (headers, toolbars, section titles). */
export const classDetailsContentPaddingSx: SxProps<Theme> = mobileContentGutterBelowLgSx;

/** Inner padding for edge-to-edge card bodies on mobile/tablet. */
export const classDetailsCardInnerPaddingSx: SxProps<Theme> = theme => ({
  [mobileTabletMedia(theme)]: {
    paddingInline: theme.spacing(2),
    paddingBlock: theme.spacing(3),
  },
});

/** Stacks page sections with a fixed gap on mobile/tablet. */
export const classDetailsSectionStackSx: SxProps<Theme> = theme => ({
  display: "flex",
  flexDirection: "column",
  [mobileTabletMedia(theme)]: {
    gap: theme.spacing(CLASS_DETAILS_MOBILE_SECTION_GAP),
  },
});
