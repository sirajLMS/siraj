"use client";

import type { Theme } from "@mui/material";
import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";

export interface SupervisorHeroCardSharedProps {
  readonly icon: ReactNode;
  readonly iconSx: (theme: Theme) => {
    readonly backgroundColor: string;
    readonly color: string;
  };
  readonly title: string;
  readonly subtitle: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
  readonly showAction: boolean;
  readonly children?: ReactNode;
}

const CARD_SX = mergeSx(mobileContentGutterSx, (theme: Theme) => ({
  width: "100%",
  backgroundColor: theme.palette.surfaceContainerHigh,
  borderRadius: 0,
  py: 2.5,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
  borderLeft: "none",
  borderRight: "none",
  boxShadow: "none",
}));

const ICON_CIRCLE_BASE = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
} as const;

export function SupervisorHeroCardShared({
  icon,
  iconSx,
  title,
  subtitle,
  actionLabel,
  onAction,
  showAction,
  children,
}: Readonly<SupervisorHeroCardSharedProps>) {
  return (
    <Box sx={CARD_SX}>
      <Stack sx={{ flexDirection: "row", alignItems: "flex-start", gap: 1.5 }}>
        <Box sx={theme => ({ ...ICON_CIRCLE_BASE, ...iconSx(theme) })}>{icon}</Box>
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.5 }}>
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
        <MobilePrimaryPageAction onClick={onAction} sx={{ alignSelf: "flex-start" }}>
          {actionLabel}
        </MobilePrimaryPageAction>
      ) : null}
    </Box>
  );
}
