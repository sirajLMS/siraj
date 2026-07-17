import type { SxProps, Theme } from "@mui/material/styles";

/** Mirrors directional icons (chevrons, arrows) when `theme.direction` is RTL. */
export const rtlFlipIconSxDesktop: SxProps<Theme> = theme => ({
  transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
});
