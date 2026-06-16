"use client";

import { alpha, Box, Paper, type SxProps, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { mergeSx } from "./mergeSx";

interface SectionPanelProps {
  readonly title?: string;
  readonly subTitle?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly sx?: SxProps<Theme>;
}

/**
 * Standard section shell: bordered Paper with optional title bar + actions.
 */
export function SectionPanel({ title, subTitle, actions, children, sx }: SectionPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={mergeSx(
        {
          bgcolor: theme => alpha(theme.palette.surfaceContainer, 0.95),
          borderRadius: theme => theme.layout.radius.section,
          border: theme => `1px solid ${theme.palette.outlineVariant}`,
          overflow: "hidden",
        },
        sx
      )}
    >
      {(title || actions) && (
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            {title && (
              <Typography variant="titleLg" sx={{ color: theme => theme.palette.onSurface }}>
                {title}
              </Typography>
            )}
            {subTitle && (
              <Typography
                variant="bodyMd"
                sx={{
                  color: theme => alpha(theme.palette.onSurfaceVariant, 0.8),
                  paddingInlineStart: 0.5,
                }}
              >
                {subTitle}
              </Typography>
            )}
          </Box>
          {actions && <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>{actions}</Box>}
        </Box>
      )}
      {children}
    </Paper>
  );
}
