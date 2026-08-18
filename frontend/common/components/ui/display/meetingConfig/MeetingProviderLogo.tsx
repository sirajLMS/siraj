"use client";

import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Avatar, Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { Translation, useAppTranslation } from "@/shared/locale";

export type MeetingProviderLogoSize = "small" | "medium" | "large";

export interface MeetingProviderLogoProps {
  readonly providerSlug: string | null | undefined;
  readonly providerName?: string | null;
  readonly logoUrl?: string | null;
  readonly size?: MeetingProviderLogoSize;
  readonly sx?: SxProps<Theme>;
}

const SIZE_MAP: Record<MeetingProviderLogoSize, number> = {
  small: 20,
  medium: 32,
  large: 48,
};

const PROVIDER_LOGO_SOURCES: Record<string, string> = {
  zoom: "/meeting-providers/zoom.svg",
  google_meet: "/meeting-providers/google-meet.svg",
  microsoft_teams: "/meeting-providers/microsoft-teams.svg",
  custom: "/meeting-providers/custom.svg",
};

function resolveLogoSrc(slug: string): string | null {
  const normalized = slug.toLowerCase();
  return PROVIDER_LOGO_SOURCES[normalized] ?? null;
}

function renderImageLogo(src: string, dimension: number, alt: string, sx: SxProps<Theme> | undefined): React.ReactNode {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={mergeSx({ width: dimension, height: dimension, objectFit: "contain" }, sx)}
    />
  );
}

function renderFallbackIcon(dimension: number, alt: string): React.ReactNode {
  return (
    <Avatar
      alt={alt}
      sx={theme => ({
        width: dimension,
        height: dimension,
        backgroundColor: theme.palette.primaryContainer,
        color: theme.palette.onPrimaryContainer,
      })}
    >
      <VideocamOutlinedIcon sx={{ fontSize: dimension * 0.6 }} />
    </Avatar>
  );
}

export function MeetingProviderLogo({
  providerSlug,
  providerName,
  logoUrl,
  size = "medium",
  sx,
}: Readonly<MeetingProviderLogoProps>): React.ReactNode {
  const labels = useAppTranslation(Translation.Ui.MeetingConfig);
  const dimension = SIZE_MAP[size];
  const displayName = providerName ?? providerSlug ?? "";
  const altText = displayName ? labels.providerLogoAlt(displayName) : labels.providerLogoFallbackAlt;

  if (logoUrl) {
    return renderImageLogo(logoUrl, dimension, altText, sx);
  }

  const slug = providerSlug ?? "";
  const logoSrc = resolveLogoSrc(slug);

  if (logoSrc) {
    return renderImageLogo(logoSrc, dimension, altText, sx);
  }

  return renderFallbackIcon(dimension, altText);
}
