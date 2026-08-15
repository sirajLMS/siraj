"use client";

import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { Box, Button, CircularProgress, Stack, Typography, useMediaQuery } from "@mui/material";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";

export type TokenExpiryLevel = "safe" | "warning" | "critical" | "expired";

export interface TokenExpiryWarningProps {
  readonly labels: Pick<MeetingConfigEnhancementLabels, "expiresInDays" | "expiresInHours" | "expired" | "reconnect">;
  readonly providerName: string;
  readonly expiresAt: Date | null;
  readonly onReconnect: () => void;
  readonly reconnecting?: boolean;
}

const SAFE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;
const WARNING_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;
const CRITICAL_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Two 1-second pulses (amber banner fade) on mount when ≤1 day remaining. */
const PULSE_ANIMATION = "token-expiry-pulse 1s ease-in-out 2";

type PaletteSxParam = { palette: { warning: { main: string }; error: { main: string } } };

function deriveLevel(expiresAt: Date | null): TokenExpiryLevel {
  if (!expiresAt) return "safe";
  const remaining = expiresAt.getTime() - Date.now();
  if (remaining <= 0) return "expired";
  if (remaining <= CRITICAL_THRESHOLD_MS) return "critical";
  if (remaining <= WARNING_THRESHOLD_MS) return "warning";
  if (remaining <= SAFE_THRESHOLD_MS) return "warning";
  return "safe";
}

function formatCountdown(expiresAt: Date, level: TokenExpiryLevel, labels: TokenExpiryWarningProps["labels"]): string {
  const remaining = expiresAt.getTime() - Date.now();
  if (remaining <= 0) return labels.expired;
  if (level === "critical") {
    const hours = Math.max(1, Math.ceil(remaining / HOUR_MS));
    return labels.expiresInHours(hours);
  }
  const days = Math.max(1, Math.ceil(remaining / DAY_MS));
  return labels.expiresInDays(days);
}

type LevelVisual = {
  readonly icon: React.ReactNode;
  readonly colorSx: (theme: PaletteSxParam) => { readonly color: string };
};

function buildLevelVisual(level: TokenExpiryLevel): LevelVisual {
  if (level === "warning") {
    return {
      icon: <WarningAmberOutlinedIcon />,
      colorSx: theme => ({ color: theme.palette.warning.main }),
    };
  }
  return {
    icon: <ErrorOutlinedIcon />,
    colorSx: theme => ({ color: theme.palette.error.main }),
  };
}

function levelBorderColor(theme: PaletteSxParam, level: TokenExpiryLevel): string {
  return level === "warning" ? theme.palette.warning.main : theme.palette.error.main;
}

export function TokenExpiryWarning({
  labels,
  providerName,
  expiresAt,
  onReconnect,
  reconnecting = false,
}: Readonly<TokenExpiryWarningProps>) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true });
  const level = deriveLevel(expiresAt);
  if (level === "safe") return null;

  const visual = buildLevelVisual(level);
  const countdownText = expiresAt ? formatCountdown(expiresAt, level, labels) : labels.expired;
  const showPulse = level === "critical" && !reducedMotion;

  return (
    <Box
      component="output"
      aria-live="polite"
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
        py: 1,
        px: 2,
        borderRadius: 1,
        border: 1,
        borderColor: levelBorderColor(theme, level),
        ...(showPulse
          ? {
              "@keyframes token-expiry-pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.6 },
              },
              animation: PULSE_ANIMATION,
            }
          : {}),
      })}
    >
      <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
        <Box sx={visual.colorSx}>{visual.icon}</Box>
        <Typography sx={theme => ({ typography: "bodySm", ...visual.colorSx(theme) })}>
          {providerName} &middot; {countdownText}
        </Typography>
      </Stack>
      <Button
        variant="outlined"
        disabled={reconnecting}
        startIcon={reconnecting ? <CircularProgress size={16} /> : <RefreshOutlinedIcon />}
        onClick={onReconnect}
        sx={theme => ({
          color: levelBorderColor(theme, level),
          borderColor: levelBorderColor(theme, level),
          minHeight: 48,
        })}
      >
        {labels.reconnect}
      </Button>
    </Box>
  );
}
