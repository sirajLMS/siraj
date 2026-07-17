import type { SxProps, Theme } from "@mui/material";

export const labelSx: SxProps<Theme> = theme => ({
  ...theme.typography.labelMd,
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
  display: "block",
  mb: 0.5,
});

export const outlinedInputSx: SxProps<Theme> = {
  borderRadius: 3,
};
