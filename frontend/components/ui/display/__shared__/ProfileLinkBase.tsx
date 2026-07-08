import { Stack, Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Link } from "@/shared/i18n/routing";

export type ProfileLinkBaseProps = {
  readonly href?: string | null;
  readonly name: string;
  readonly showAvatar?: boolean;
  readonly avatarSize?: number;
  readonly fallbackInitial?: string;
  readonly label?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly fontWeight?: number;
  /** When true, use primary color for the name (linked look). Default true when href is set. */
  readonly emphasizeLink?: boolean;
  /** Renders the avatar node (receives resolved avatar props). */
  readonly renderAvatar: (args: { name: string; fallbackInitial: string; size: number }) => ReactNode;
};

/**
 * Shared presentational base for profile-link components.
 * Renders an avatar (via `renderAvatar`), optional label, and the entity name —
 * linking to the target page only when `href` is provided.
 */
export function ProfileLinkBase({
  href,
  name,
  showAvatar = true,
  avatarSize = 28,
  fallbackInitial = "?",
  label,
  typographyVariant = "bodyMd",
  fontWeight = 600,
  emphasizeLink,
  renderAvatar,
}: ProfileLinkBaseProps) {
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
      {showAvatar ? renderAvatar({ name, fallbackInitial, size: avatarSize }) : null}
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
