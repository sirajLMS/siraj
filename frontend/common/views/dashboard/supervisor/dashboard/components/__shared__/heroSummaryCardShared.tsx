"use client";

import { Box, Stack, type SxProps, type Theme, Typography } from "@mui/material";
import type { ComponentType, ReactElement, ReactNode } from "react";

export interface HeroSummaryCardSharedProps {
  readonly icon: ReactElement;
  readonly iconBgPaletteKey: "primaryContainer" | "secondaryContainer";
  readonly title: string;
  readonly subtitle: string;
  readonly showAction: boolean;
  readonly actionLabel: string;
  readonly onAction: () => void;
  readonly children?: ReactNode;
  readonly PrimaryActionComponent: ComponentType<{ onClick: () => void; sx?: SxProps<Theme>; children: ReactNode }>;
  readonly cardSx?: SxProps<Theme>;
  readonly iconCircleSize?: number;
  readonly stackGap?: number;
  readonly titleSubtitleGap?: number;
  readonly actionSx?: SxProps<Theme>;
}

const DEFAULT_CARD_SX: SxProps<Theme> = theme => ({
  backgroundColor: theme.palette.surfaceContainerHigh,
  borderRadius: theme.layout.radius.section,
  p: 3,
  display: "flex",
  flexDirection: "column",
  gap: 2.5,
  height: "100%",
  border: `1px solid ${theme.palette.outlineVariant}`,
});

const DEFAULT_ACTION_SX: SxProps<Theme> = { alignSelf: "flex-start", mt: "auto" };

export function HeroSummaryCardShared({
  icon,
  iconBgPaletteKey,
  title,
  subtitle,
  showAction,
  actionLabel,
  onAction,
  children,
  PrimaryActionComponent,
  cardSx = DEFAULT_CARD_SX,
  iconCircleSize = 48,
  stackGap = 2,
  titleSubtitleGap = 0.75,
  actionSx = DEFAULT_ACTION_SX,
}: Readonly<HeroSummaryCardSharedProps>) {
  return (
    <Box sx={cardSx}>
      <Stack sx={{ flexDirection: "row", alignItems: "flex-start", gap: stackGap, flex: 1 }}>
        <Box
          sx={theme => ({
            width: iconCircleSize,
            height: iconCircleSize,
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
        <Stack sx={{ flex: 1, minWidth: 0, gap: titleSubtitleGap }}>
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
        <PrimaryActionComponent onClick={onAction} sx={actionSx}>
          {actionLabel}
        </PrimaryActionComponent>
      ) : null}
    </Box>
  );
}
