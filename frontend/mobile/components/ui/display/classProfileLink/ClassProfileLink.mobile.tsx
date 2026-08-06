"use client";

import { Avatar, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { UiTypographyVariantLoose } from "@/frontend/common/types/shared.types";
import { avatarInitials } from "@/frontend/common/utils/avatar";
import { Link } from "@/shared/i18n";

export type MobileClassProfileLinkProps = {
  readonly href?: string | null;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly showAvatar?: boolean;
  readonly avatarSize?: number;
  readonly fallbackInitial?: string;
  readonly label?: string;
  /** Wider than `TypographyProps["variant"]` to admit custom theme variants like `bodySm`. */
  readonly typographyVariant?: UiTypographyVariantLoose;
  readonly fontWeight?: number;
  /** When true, use primary color for the name (linked look). Default true when href is set. */
  readonly emphasizeLink?: boolean;
};

const ROUNDED_BORDER_RADIUS = 1.5;
const FALLBACK_SX = {
  typography: "labelMd",
  fontWeight: 700,
} as const;

function getClassAvatarFallbackSx(theme: Theme, src?: string | null) {
  if (src) {
    return {};
  }
  return {
    backgroundColor: theme.palette.secondaryContainer,
    color: theme.palette.onSecondaryContainer,
    ...FALLBACK_SX,
  };
}

/**
 * Mobile-tier class profile link. Renders an inline-rounded ClassAvatar +
 * optional label + class name, linking only when `href` is provided.
 * Tighter spacing and smaller default avatar than desktop.
 * Self-contained — no shared base, no avatar imports from common.
 */
export function MobileClassProfileLink({
  href,
  name,
  avatarUrl,
  showAvatar = true,
  avatarSize = 24,
  fallbackInitial = "?",
  label,
  typographyVariant = "bodySm",
  fontWeight = 600,
  emphasizeLink,
}: MobileClassProfileLinkProps) {
  const isLinked = Boolean(href);
  const useLinkColor = emphasizeLink ?? isLinked;

  const nameTypography = (
    <Typography
      sx={theme => ({
        typography: typographyVariant,
        fontWeight,
        color: useLinkColor ? theme.palette.primary.main : theme.palette.text.secondary,
      })}
    >
      {name}
    </Typography>
  );

  const avatarNode = showAvatar
    ? renderClassAvatar({
        src: avatarUrl ?? null,
        label: name || fallbackInitial,
        size: avatarSize,
        fallbackInitial,
      })
    : null;

  const content = (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", height: "100%", minWidth: 0 }}>
      {avatarNode}
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        {label ? (
          <Typography sx={{ typography: "labelSm", color: (theme: Theme) => theme.palette.text.secondary }}>
            {label}
          </Typography>
        ) : null}
        {nameTypography}
      </Stack>
    </Stack>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "flex", height: "100%" }}>
      {content}
    </Link>
  );
}

function renderClassAvatar({
  src,
  label,
  size,
  fallbackInitial,
}: {
  src: string | null;
  label: string;
  size: number;
  fallbackInitial: string;
}): ReactNode {
  const initials = label ? avatarInitials(label) : fallbackInitial;
  const avatarContent = src ? null : initials;
  return (
    <Avatar
      src={src ?? undefined}
      alt={label || undefined}
      variant="rounded"
      sx={[
        {
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: ROUNDED_BORDER_RADIUS,
        },
        (theme: Theme) => getClassAvatarFallbackSx(theme, src),
      ]}
    >
      {avatarContent}
    </Avatar>
  );
}
