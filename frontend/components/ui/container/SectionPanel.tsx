"use client";

import { alpha, Box, Paper, type SxProps, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { edgeToEdgeSx } from "@/frontend/utils/sx/edgeToEdgeSx";
import { mergeSx } from "@/frontend/utils/sx/mergeSx";

interface SectionPanelProps {
  readonly title?: ReactNode;
  readonly subTitle?: string;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  readonly edgeToEdge?: boolean;
  readonly sx?: SxProps<Theme>;
}

/**
 * Standard section shell: bordered Paper with optional title bar + actions.
 */
export function SectionPanel({ title, subTitle, actions, children, edgeToEdge = false, sx }: SectionPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={mergeSx(
        {
          backgroundColor: theme => alpha(theme.palette.surfaceContainer, 0.95),
          // borderRadius: theme => theme.layout.radius.section,
          // border: theme => `1px solid ${theme.palette.outlineVariant}`,
          overflow: "hidden",
        },
        edgeToEdge ? edgeToEdgeSx : undefined,
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
              {title &&
                (typeof title === "string" ? (
                  <Typography variant="titleLg" sx={{ color: theme => theme.palette.onSurface }}>
                    {title}
                  </Typography>
                ) : (
                  title
                ))}
            </Box>
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
          px: { xs: 2, md: 3 },
          py: 2.5,
        }}
      >
        {children}
      </Box>
    );
  }
}
