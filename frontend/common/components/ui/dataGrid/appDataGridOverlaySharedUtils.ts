import type { Theme } from "@mui/material/styles";

export function overlayBoxSx(theme: Theme) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    py: theme.spacing(6),
  } as const;
}
