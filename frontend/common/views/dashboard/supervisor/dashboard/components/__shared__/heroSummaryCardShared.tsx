"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactElement, ReactNode } from "react";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";

export interface HeroSummaryCardSharedProps {
  readonly icon: ReactElement;
  readonly iconBgPaletteKey: "primaryContainer" | "secondaryContainer";
  readonly title: string;
  readonly subtitle: string;
  readonly showAction: boolean;
  readonly actionLabel: string;
  readonly onAction: () => void;
  readonly children?: ReactNode;
}

export function HeroSummaryCardShared({
  icon,
  iconBgPaletteKey,
  title,
  subtitle,
  showAction,
  actionLabel,
  onAction,
  children,
}: Readonly<HeroSummaryCardSharedProps>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerHigh,
        borderRadius: theme.layout.radius.section,
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        height: "100%",
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack sx={{ flexDirection: "row", alignItems: "flex-start", gap: 2, flex: 1 }}>
        <Box
          sx={theme => ({
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: theme.palette[iconBgPaletteKey],
            color:
              iconBgPaletteKey === "primaryContainer"
                ? theme.palette.onPrimaryContainer
                : theme.palette.onSecondaryContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          {icon}
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.75 }}>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
            {title}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {subtitle}
          </Typography>
        </Stack>
      </Stack>
      {children}
      {showAction ? (
        <DesktopPrimaryPageAction onClick={onAction} sx={{ alignSelf: "flex-start", mt: "auto" }}>
          {actionLabel}
        </DesktopPrimaryPageAction>
      ) : null}
    </Box>
  );
}
