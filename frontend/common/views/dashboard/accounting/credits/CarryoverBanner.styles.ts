import { alpha, type Theme } from "@mui/material/styles";

export const FIELDS_GRID_SX = {
  display: "grid",
  gap: 2,
  mt: 1,
  // One column on phones, two from `sm` up so tablets keep the date pickers
  // side-by-side, and three from `lg` up where all three date pickers share
  // one row below the full-width teacher picker. The wide layout engages at
  // `lg` (1200px) rather than `xl` so common 1440px desktops use it.
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
} as const;

/** Teacher picker spans the full grid width on every breakpoint. */
export const TEACHER_FIELD_SX = { gridColumn: "1 / -1" } as const;

export const bannerAlertSx = (theme: Theme) => ({
  alignItems: "flex-start",
  // The stock success-alert tone renders muddy-dark against the page;
  // the success container pair is the theme's contrast-safe surface.
  backgroundColor: theme.palette.successContainer,
  color: theme.palette.onSuccessContainer,
  "& .MuiAlert-icon": { color: theme.palette.success.main },
  // Outlined inputs inherit the page-level divider alpha, which reads as
  // a ghost over the green banner surface; derive the ring from the
  // banner's own on-container tone so it stays visible. Scoped to the
  // banner's fields only — the shared picker/field themes are untouched.
  "& .MuiOutlinedInput-root:not(.Mui-focused) .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-root:not(.Mui-focused) .MuiPickersOutlinedInput-notchedOutline":
    {
      borderColor: alpha(theme.palette.onSuccessContainer, 0.35),
    },
  // Floating labels ride in the outlined-input notch above the banner
  // surface; paint them with the banner tone so the notch does not let
  // the surrounding page show through behind the label text.
  "& .MuiInputLabel-root, & .MuiPickersInputLabel-root": {
    backgroundColor: theme.palette.successContainer,
  },
});

export const bannerCaptionSx = (theme: Theme) => ({
  // Keep the caption visually subordinate to the banner title while
  // staying on the contrast-safe on-container tone.
  color: alpha(theme.palette.onSuccessContainer, 0.85),
});
