"use client";

import { alpha, Box, Paper, type SxProps, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { desktopSectionContentInsetSx } from "@/frontend/desktop/components/ui/container/desktopSectionContentInsetSx";

export interface DesktopSectionPanelProps {
  readonly id?: string;
  readonly title?: ReactNode;
  readonly subTitle?: string;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  /**
   * When `true` (default), children are wrapped in padded inset.
   * Set to `false` for data grids (`DesktopAppDataGrid`, `*DataGrid.desktop.tsx`)
   * so the grid sits flush under the title bar. Use `desktopSectionContentInsetSx`
   * on any non-grid prefix siblings (filters, toolbars) in the same section.
   */
  readonly contentPadding?: boolean;
  readonly sx?: SxProps<Theme>;
}

/**
 * Desktop section shell: bordered Paper with optional title bar + actions.
 * Title bar uses 3-unit horizontal / 2.5-unit vertical padding and supports
 * `flexWrap` so multiple action buttons stack gracefully on wider screens.
 *
 * Data grid sections must pass `contentPadding={false}` so the grid is edge-to-edge.
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

  function renderChildren(): ReactNode {
    let content: ReactNode = null;
    if (children) {
      content = contentPadding ? <Box sx={desktopSectionContentInsetSx}>{children}</Box> : children;
    }
    return content;
  }
}

function renderTitle(title: ReactNode): ReactNode {
  let content: ReactNode;
  if (typeof title === "string") {
    content = (
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
        {title}
      </Typography>
    );
  } else {
    content = title;
  }
  return content;
}
