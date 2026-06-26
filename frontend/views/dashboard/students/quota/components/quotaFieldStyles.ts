import type { Theme } from "@mui/material";

export const quotaInputSx = (theme: Theme) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    backgroundColor: { xs: "transparent", md: theme.palette.background.paper },
    "& fieldset": {
      borderWidth: { xs: "0 0 2px 0", md: "1px" },
      borderColor: theme.palette.border.light,
    },
    "&:hover fieldset": { borderColor: theme.palette.outline },
    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
  },
});
