"use client";

import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export interface DstMigrationPanelSharedOptions {
  readonly getColor: (theme: Theme) => string;
  readonly getOnColor: (theme: Theme) => string;
  readonly getHeaderAlpha: (theme: Theme) => string;
  readonly getTitleColor: (theme: Theme) => string;
  readonly icon: ReactNode;
  readonly title: string;
  readonly headerActions: ReactNode | undefined;
  readonly contentPadding: number | undefined;
  readonly children: ReactNode;
}

export function DstMigrationPanelShared(options: DstMigrationPanelSharedOptions) {
  const hasHeaderActions = options.headerActions !== undefined;

  const headerSx = (theme: Theme) => ({
    px: 3,
    py: 2,
    display: "flex",
    alignItems: "center",
    ...(hasHeaderActions ? { justifyContent: "space-between" } : { gap: 1.5 }),
    backgroundColor: options.getHeaderAlpha(theme),
    borderBottom: `1px solid ${theme.palette.outlineVariant}`,
  });

  const iconCircleSx = (theme: Theme) => ({
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: options.getColor(theme),
    color: options.getOnColor(theme),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  const titleSx = (theme: Theme) => ({ color: options.getTitleColor(theme) });

  let content: ReactNode;
  if (options.contentPadding !== undefined) {
    content = <Box sx={{ p: options.contentPadding }}>{options.children}</Box>;
  } else {
    content = options.children;
  }

  if (hasHeaderActions) {
    return (
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.surfaceContainerLowest,
          borderRadius: 3,
          border: `1px solid ${theme.palette.outlineVariant}`,
          overflow: "hidden",
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <Box sx={headerSx}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={iconCircleSx}>{options.icon}</Box>
            <Typography variant="titleLg" sx={titleSx}>
              {options.title}
            </Typography>
          </Box>
          {options.headerActions}
        </Box>
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        borderRadius: 3,
        border: `1px solid ${theme.palette.outlineVariant}`,
        overflow: "hidden",
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Box sx={headerSx}>
        <Box sx={iconCircleSx}>{options.icon}</Box>
        <Typography variant="titleLg" sx={titleSx}>
          {options.title}
        </Typography>
      </Box>
      {content}
    </Box>
  );
}
