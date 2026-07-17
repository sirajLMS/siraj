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
  (interactive: boolean, edgeToEdge: boolean): SxProps<Theme> =>
  theme => ({
    borderRadius: theme.layout.radius.card,
    border: `1px solid ${theme.palette.border.light}`,
    boxShadow: theme.palette.shadow.card,
    backgroundColor: theme.palette.background.paper,
    padding: edgeToEdge ? theme.layout.cardPadding : theme.spacing(2),
    cursor: interactive ? "pointer" : undefined,
    transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
    ...(interactive && {
      "&:hover": {
        borderColor: theme.palette.primary.main,
        boxShadow: theme.palette.shadow.cardHover,
      },
      "&:active": {
        transform: "scale(0.99)",
      },
    }),
  });

/**
 * Mobile tier low-level card wrapper enforcing theme tokens for radius, border, and shadow.
 *
 * Mobile tuning vs desktop: `edgeToEdge` defaults to `true` (flush edge-to-edge
 * layout), and padding shrinks to `theme.spacing(2)` when not flush (denser on
 * narrow viewports). Interactive elements scale down on `:active` to feel
 * touch-responsive.
 */
export function MobileBaseCard({
  interactive = false,
  edgeToEdge = true,
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
        baseCardSx(interactive, edgeToEdge),
        edgeToEdge ? edgeToEdgeCardShellSx : undefined,
        edgeToEdge && edgeToEdgePadding ? edgeToEdgeCardPaddingSx : undefined,
        sx
      )}
    >
      {children}
    </Card>
  );
}
