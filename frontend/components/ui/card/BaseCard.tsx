"use client";

import { Card, type CardProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { edgeToEdgeCardPaddingSx, edgeToEdgeCardShellSx } from "@/frontend/utils/sx/edgeToEdgeSx";
import { mergeSx } from "@/frontend/utils/sx/mergeSx";

interface BaseCardProps extends CardProps {
  readonly interactive?: boolean;
  readonly edgeToEdge?: boolean;
  /** When false, only the shell is flush; children supply their own inner padding. */
  readonly edgeToEdgePadding?: boolean;
}

const baseCardSx =
  (interactive: boolean): SxProps<Theme> =>
  theme => ({
    borderRadius: theme.layout.radius.card,
    border: `1px solid ${theme.palette.border.light}`,
    boxShadow: theme.palette.shadow.card,
    backgroundColor: theme.palette.background.paper,
    padding: theme.layout.cardPadding,
    cursor: interactive ? "pointer" : undefined,
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    ...(interactive && {
      "&:hover": {
        borderColor: theme.palette.primary.main,
        boxShadow: theme.palette.shadow.cardHover,
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
