"use client";

import { Box, Link, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";

type SxCallback = (theme: Theme) => Record<string, unknown>;

export interface SimulationBannerSharedProps {
  readonly active: boolean;
  readonly message: React.ReactNode;
  readonly endLabel: string;
  readonly onEnd: () => void;
  readonly loading: boolean;
  readonly bannerSx: SxCallback;
  readonly linkSx: SxCallback;
}

export function SimulationBannerShared({
  active,
  message,
  endLabel,
  onEnd,
  loading,
  bannerSx,
  linkSx,
}: Readonly<SimulationBannerSharedProps>) {
  if (!active) {
    return null;
  }

  return (
    <Box
      sx={theme => ({
        position: "sticky",
        top: 0,
        zIndex: theme.zIndex.appBar + 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: theme.spacing(0.5),
        px: theme.spacing(2),
        py: theme.spacing(1.25),
        borderBottom: `1px solid ${theme.palette.divider}`,
        typography: "bodyMd",
        ...bannerSx(theme),
      })}
    >
      <Typography component="span" sx={{ fontWeight: 600, textAlign: "center" }}>
        {message}
      </Typography>
      <Link
        component="button"
        type="button"
        underline="always"
        disabled={loading}
        onClick={() => onEnd()}
        sx={theme => ({
          fontWeight: 700,
          cursor: loading ? "wait" : "pointer",
          border: "none",
          background: "none",
          typography: "bodyMd",
          ...linkSx(theme),
        })}
      >
        {endLabel}
      </Link>
    </Box>
  );
}
