import type { Theme } from "@mui/material/styles";

/**
 * Contrast fix for locked (disabled) snapshot fields on the edit payment form:
 * the default disabled alpha renders values nearly illegible on dark surfaces,
 * so read-only values are raised to secondary-text emphasis while the control
 * itself remains clearly non-editable.
 */
export const paymentReadOnlyFieldSx = (theme: Theme) => ({
  "& .MuiInputBase-input.Mui-disabled": {
    color: theme.palette.text.secondary,
    WebkitTextFillColor: theme.palette.text.secondary,
  },
});
