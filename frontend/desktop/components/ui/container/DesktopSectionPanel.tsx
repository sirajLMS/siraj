"use client";

import { alpha, Box, Paper, type SxProps, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface DesktopSectionPanelProps {
  readonly id?: string;
  readonly title?: ReactNode;
  readonly subTitle?: string;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  readonly contentPadding?: boolean;
  readonly sx?: SxProps<Theme>;
}

/**
 * Desktop section shell: bordered Paper with optional title bar + actions.
 * Title bar uses 3-unit horizontal / 2.5-unit vertical padding and supports
 * `flexWrap` so multiple action buttons stack gracefully on wider screens.
 */
export function DesktopSectionPanel({
  id,
  title,
  subTitle,
  actions,
  children,
  contentPadding = true,
  sx,
}: DesktopSectionPanelProps) {
  return (
    <Paper
      id={id}
      elevation={0}
      sx={mergeSx(
        {
          backgroundColor: theme => alpha(theme.palette.surfaceContainer, 0.95),
          overflow: "hidden",
        },
        sx
      )}
    >
      {(title || actions) && (
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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
                  color: theme => alpha(theme.palette.onSurfaceVariant, 0.8),
                  paddingInlineStart: 0.5,
                }}
              >
                {subTitle}
              </Typography>
            ) : null}
          </Box>
          {actions ? <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>{actions}</Box> : null}
        </Box>
      )}
      {renderChildren()}
    </Paper>
  );

  function renderChildren() {
    if (!children) {
      return null;
    }

    if (!contentPadding) {
      return children;
    }

    return (
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 2.5,
        }}
      >
        {children}
      </Box>
    );
  }
}

function renderTitle(title: ReactNode) {
  if (typeof title === "string") {
    return (
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
        {title}
      </Typography>
    );
  }
  return title;
}
