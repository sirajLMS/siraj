"use client";

import { Avatar, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { avatarInitials } from "@/frontend/common/utils/avatar";
import { Link } from "@/shared/i18n";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";

export type DesktopPersonProfileLinkProps = {
  readonly href?: string | null;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly showAvatar?: boolean;
  readonly avatarSize?: number;
  readonly fallbackInitial?: string;
  readonly label?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly fontWeight?: number;
  /** When true, use primary color for the name (linked look). Default true when href is set. */
  readonly emphasizeLink?: boolean;
};

const FALLBACK_SX = {
  typography: "labelMd",
  fontWeight: 700,
} as const;

function getUserAvatarSx(theme: Theme, src?: string | null) {
  if (src) {
    return { border: `1px solid ${theme.palette.border.light}` };
  }
  return {
    backgroundColor: theme.palette.primaryContainer,
    color: theme.palette.onPrimaryContainer,
    ...FALLBACK_SX,
  };
}

/**
 * Desktop-tier person profile link. Renders an inline-circular UserAvatar +
 * optional label + person name, linking only when `href` is provided.
 * Self-contained — no shared base, no avatar imports from common.
 */
export function DesktopPersonProfileLink({
  href,
  name,
  avatarUrl,
  showAvatar = true,
  avatarSize = 28,
  fallbackInitial = "?",
  label,
  typographyVariant = "bodyMd",
  fontWeight = 600,
  emphasizeLink,
}: DesktopPersonProfileLinkProps) {
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
    ? renderUserAvatar({
        src: avatarUrl ?? null,
        label: name || fallbackInitial,
        size: avatarSize,
        fallbackInitial,
      })
    : null;

  const content = (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", height: "100%" }}>
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

function renderUserAvatar({
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
      variant="circular"
      sx={[
        {
          width: size,
          height: size,
          flexShrink: 0,
        },
        (theme: Theme) => getUserAvatarSx(theme, src),
      ]}
    >
      {avatarContent}
    </Avatar>
  );
}
