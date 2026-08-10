"use client";

import { alpha, Box, Paper, type SxProps, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";

export interface MobileSectionPanelProps {
  readonly id?: string;
  readonly title?: ReactNode;
  readonly subTitle?: string;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  /** Mobile default: edge-to-edge (square corners, no inline borders). */
  readonly edgeToEdge?: boolean;
  /**
   * When true (default), body children get the shared content gutter.
   * Set false for full-bleed children that own their own inset
   * (`MobileCardList`, `MobileHorizontalScrollRow`, `MobileMetricCardGrid`).
   */
  readonly contentInset?: boolean;
  readonly sx?: SxProps<Theme>;
}

/**
 * Mobile section shell: bordered Paper with optional title bar + actions.
 * Defaults to edge-to-edge (square corners, no inline borders) so panels
 * cover the full mobile viewport width. Title bar and body (unless
 * `contentInset={false}`) use the shared content gutter.
 */
export function MobileSectionPanel({
  id,
  title,
  subTitle,
  actions,
  children,
  edgeToEdge = true,
  contentInset = true,
  sx,
}: MobileSectionPanelProps) {
  return (
    <Paper
      id={id}
      elevation={0}
      sx={mergeSx(
        {
          backgroundColor: theme => alpha(theme.palette.surfaceContainer, 0.95),
          overflow: "hidden",
        },
        edgeToEdge
          ? {
              borderRadius: "0 !important",
              borderInlineStart: "none",
              borderInlineEnd: "none",
              borderLeft: "none",
              borderRight: "none",
              borderTop: theme => `1px solid ${theme.palette.outlineVariant}`,
              borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
            }
          : undefined,
        sx
      )}
    >
      {(title || actions) && (
        <Box
          sx={mergeSx(mobileContentGutterSx, {
            py: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
          })}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {title ? renderTitle(title) : null}
            </Box>
            {subTitle ? (
              <Typography
                variant="bodyMd"
                sx={{
                  color: theme => alpha(theme.palette.onSurfaceVariant, 0.85),
                  paddingInlineStart: 0.25,
                }}
              >
                {subTitle}
              </Typography>
            ) : null}
          </Box>
          {actions ? (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                "& > *": { flex: "1 1 auto", minWidth: 0 },
              }}
            >
              {actions}
            </Box>
          ) : null}
        </Box>
      )}
      {renderChildren()}
    </Paper>
  );

  function renderChildren(): ReactNode {
    let content: ReactNode = null;
    if (children) {
      content = contentInset ? (
        <Box
          sx={mergeSx(mobileContentGutterSx, {
            py: 2,
          })}
        >
          {children}
        </Box>
      ) : (
        children
      );
    }
    return content;
  }
}

function renderTitle(title: ReactNode): ReactNode {
  let content: ReactNode;
  if (typeof title === "string") {
    content = (
      <Typography sx={theme => ({ typography: "titleMd", color: theme.palette.onSurface })}>{title}</Typography>
    );
  } else {
    content = title;
  }
  return content;
}
