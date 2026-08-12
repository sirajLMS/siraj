import type { Theme } from "@mui/material/styles";

export function panelCardPaperSx(theme: Theme) {
  return {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "xl",
    boxShadow: theme.palette.shadow.card,
    border: `1px solid ${theme.palette.border.main}`,
    overflow: "hidden",
    width: "100%",
  } as const;
}

export function panelCardHeaderSx(theme: Theme, px: number, py: number, gap?: number) {
  return {
    px,
    py,
    borderBottom: `1px solid ${theme.palette.border.main}`,
    display: "flex",
    alignItems: "center",
    ...(gap !== undefined ? { gap } : {}),
    backgroundColor: theme.palette.background.default,
  } as const;
}
