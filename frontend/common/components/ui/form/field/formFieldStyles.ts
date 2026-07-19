import type { SxProps, Theme } from "@mui/material";

export const labelSx: SxProps<Theme> = theme => ({
  ...theme.typography.labelMd,
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
  display: "block",
  mb: 0.5,
});

export const standardInputSx: SxProps<Theme> = theme => ({
  "&::before": { borderColor: theme.palette.outlineVariant },
  "&:hover:not(.Mui-disabled)::before": { borderColor: theme.palette.primary.main },
  "&::after": { borderColor: theme.palette.primary.main },
});

export const outlinedInputSx: SxProps<Theme> = {
  borderRadius: 3,
};

export const timeInputStandardSx: SxProps<Theme> = theme => ({
  "& .MuiInput-underline:before": { borderColor: theme.palette.outlineVariant },
  "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderColor: theme.palette.primary.main },
  "& .MuiInput-underline:after": { borderColor: theme.palette.primary.main },
});

export const timeInputOutlinedSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": { borderRadius: 3 },
};

export const durationBoxSx =
  (isMobile: boolean): SxProps<Theme> =>
  theme => ({
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: isMobile ? 2 : 1.5,
    py: isMobile ? 1.5 : 0,
    borderRadius: 1,
    border: 1,
    borderStyle: "solid",
    borderColor: theme.palette.outlineVariant,
    backgroundColor: isMobile ? theme.palette.background.paper : theme.palette.surfaceContainerLow,
    "&:focus-within": {
      borderColor: theme.palette.primary.main,
    },
  });
