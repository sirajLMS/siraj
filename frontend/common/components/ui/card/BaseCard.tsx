"use client";

import { Card, type CardProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { edgeToEdgeCardPaddingSx, edgeToEdgeCardShellSx } from "@/frontend/common/utils/sx/edgeToEdgeSx";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface BaseCardProps extends CardProps {
  readonly interactive?: boolean;
  readonly edgeToEdge?: boolean;
  /** When false, only the shell is flush; children supply their own inner padding. */
  readonly edgeToEdgePadding?: boolean;
}

const baseCardSx =
  (interactive: boolean): SxProps<Theme> =>
  theme => ({
    borderRadius: theme.layout.radius.card,
    // Use `theme.vars.*` for tokens the customize overlay (`?customize=1`)
    // live-updates via `--mui-palette-*` inline CSS vars on `<html>`. Reading
    // the hex from `theme.palette.*` would bake the SSR-resolved value into
    // the emotion class, leaving cards stuck on the SSR preset (e.g. Ocean)
    // even after clicking a different preset in the sidebar.
    border: `1px solid ${theme.vars.palette.border.light}`,
    boxShadow: theme.vars.palette.shadow.card,
    backgroundColor: theme.vars.palette.background.paper,
    padding: theme.layout.cardPadding,
    cursor: interactive ? "pointer" : undefined,
    transition: theme.transitions.create(["border-color", "box-shadow"], { duration: 150, easing: "ease" }),
    ...(interactive && {
      "&:hover": {
        borderColor: theme.vars.palette.primary.main,
        boxShadow: theme.vars.palette.shadow.cardHover,
      },
    }),
  });

/**
 * Low-level card wrapper enforcing theme tokens for radius, border, and shadow.
 */
export function BaseCard({
  interactive = false,
  edgeToEdge = false,
  edgeToEdgePadding = true,
  sx,
  children,
  ...props
}: Readonly<BaseCardProps>) {
  return (
    <Card
      elevation={0}
      {...props}
      sx={mergeSx(
        baseCardSx(interactive),
        edgeToEdge ? edgeToEdgeCardShellSx : undefined,
        edgeToEdge && edgeToEdgePadding ? edgeToEdgeCardPaddingSx : undefined,
        sx
      )}
    >
      {children}
    </Card>
  );
}
