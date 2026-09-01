import type { SxProps, Theme } from "@mui/material";

/** Non-input section/stat chrome only — never use as a form field label. Prefer MUI `label` / `InputLabel`. */
export const labelSx: SxProps<Theme> = theme => ({
  ...theme.typography.labelMd,
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
  display: "block",
  mb: 0.5,
});

export const outlinedInputSx: SxProps<Theme> = {
  borderRadius: "8px",
};

export const timeInputOutlinedSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": { borderRadius: "8px" },
};
