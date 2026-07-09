"use client";

import { Stack, Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import { UserAvatar } from "@/frontend/components/ui/avatar/UserAvatar";
import { Link } from "@/shared/i18n/routing";

export type PersonProfileLinkProps = {
  readonly href?: string | null;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly showAvatar?: boolean;
  readonly avatarSize?: number;
  readonly fallbackInitial?: string;
  readonly label?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly fontWeight?: number;
  /** When true, use primary color for the name (linked look). Default true when href is set. */
  readonly emphasizeLink?: boolean;
};

/**
 * Name (optional avatar) that links to a profile/person page when `href` is provided.
 * Renders plain text when `href` is missing — never invents a destination.
 */
export function PersonProfileLink({
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
}: PersonProfileLinkProps) {
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

  const content = (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", height: "100%" }}>
      {showAvatar ? (
        <UserAvatar src={avatarUrl} label={name || fallbackInitial} size={avatarSize}>
          {name ? null : fallbackInitial}
        </UserAvatar>
      ) : null}
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        {label ? (
          <Typography sx={{ typography: "labelSm", color: theme => theme.palette.text.secondary }}>{label}</Typography>
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
