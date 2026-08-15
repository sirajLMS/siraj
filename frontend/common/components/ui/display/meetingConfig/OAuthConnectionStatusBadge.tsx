"use client";

import { Box, Stack, Typography, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Translation, useAppTranslation } from "@/shared/locale";

// ── Types ───────────────────────────────────────────────────────────────────

export type OAuthBadgeStatus = "connected" | "expiring" | "expired" | "disconnected";

export interface OAuthConnectionStatusBadgeProps {
  readonly status: OAuthBadgeStatus;
  /** ISO datetime string of token expiry — used for the "expiring" countdown text. */
  readonly expiresAt?: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

type StatusLabelKey = "statusConnected" | "statusExpiring" | "statusExpired" | "statusNotConnected";

type StatusPalette = "success" | "warning" | "error" | "grey";

interface StatusConfig {
  readonly palette: StatusPalette;
  readonly labelKey: StatusLabelKey;
}

function getColor(theme: Theme, palette: StatusPalette): string {
  if (palette === "grey") {
    return theme.palette.text.secondary;
  }
  return theme.palette[palette].main;
}

const STATUS_CONFIGS: Readonly<Record<OAuthBadgeStatus, StatusConfig>> = {
  connected: {
    palette: "success",
    labelKey: "statusConnected",
  },
  expiring: {
    palette: "warning",
    labelKey: "statusExpiring",
  },
  expired: {
    palette: "error",
    labelKey: "statusExpired",
  },
  disconnected: {
    palette: "grey",
    labelKey: "statusNotConnected",
  },
} as const;

function calcDaysUntilExpiry(expiresAt: string): number {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  return Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
}

// ── Component ───────────────────────────────────────────────────────────────

export function OAuthConnectionStatusBadge({
  status,
  expiresAt = null,
}: Readonly<OAuthConnectionStatusBadgeProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Dashboard.OAuthFlow);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true });
  const config = STATUS_CONFIGS[status];

  let labelText: string;
  if (status === "expiring" && expiresAt) {
    const days = calcDaysUntilExpiry(expiresAt);
    if (days > 0) {
      labelText = t.expiresInDays(days);
    } else {
      labelText = t.statusExpired;
    }
  } else {
    labelText = t[config.labelKey];
  }

  return (
    <Box component="output" sx={{ display: "inline-flex", alignItems: "center" }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          gap: 0.75,
        }}
      >
        <Box
          component="span"
          sx={theme => ({
            width: 8,
            height: 8,
            borderRadius: "50%",
            flexShrink: 0,
            backgroundColor: getColor(theme, config.palette),
            transition: reducedMotion ? "none" : "background-color 200ms ease-in-out",
          })}
        />
        <Typography
          variant="labelMd"
          aria-label={t.statusAriaLabel}
          sx={theme => ({
            lineHeight: 1,
            whiteSpace: "nowrap",
            color: getColor(theme, config.palette),
          })}
        >
          {labelText}
        </Typography>
      </Stack>
    </Box>
  );
}
