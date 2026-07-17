import type { SxProps, Theme } from "@mui/material";

export const standardInputSx: SxProps<Theme> = theme => ({
  "&::before": { borderColor: theme.palette.outlineVariant },
  "&:hover:not(.Mui-disabled)::before": { borderColor: theme.palette.primary.main },
  "&::after": { borderColor: theme.palette.primary.main },
});
