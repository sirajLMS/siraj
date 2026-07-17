"use client";

import { alpha, Box, Paper, type SxProps, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface MobileSectionPanelProps {
  readonly id?: string;
  readonly title?: ReactNode;
  readonly subTitle?: string;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  /** Mobile default: edge-to-edge (square corners, no inline borders). */
  readonly edgeToEdge?: boolean;
  readonly sx?: SxProps<Theme>;
}

/**
 * Mobile section shell: bordered Paper with optional title bar + actions.
 * Defaults to edge-to-edge (square corners, no inline borders) so panels
 * cover the full mobile viewport width. Title bar uses stacked actions
 * (actions drop below the title when the row would wrap) and tighter
 * padding tuned for mobile spacing.
 */
export function MobileSectionPanel({
  id,
  title,
  subTitle,
  actions,
  children,
  edgeToEdge = true,
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
            }
          : undefined,
        sx
      )}
    >
      {(title || actions) && (
        <Box
          sx={{
            px: 2,
            py: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
          }}
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

  function renderChildren() {
    if (!children) {
      return null;
    }
    if (edgeToEdge) {
      return children;
    }
    return (
      <Box
        sx={{
          px: 2,
          py: 2,
        }}
      >
        {children}
      </Box>
    );
  }
}

function renderTitle(title: ReactNode) {
  if (typeof title === "string") {
    return <Typography sx={theme => ({ typography: "titleMd", color: theme.palette.onSurface })}>{title}</Typography>;
  }
  return title;
}
