import { Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { ProfileLinkSharedProps } from "@/frontend/common/components/ui/display/__shared__/profileLinkShared.types";
import { Link } from "@/shared/i18n";

export type ProfileLinkBaseProps = ProfileLinkSharedProps & {
  /** Horizontal spacing between avatar and text. Default: 1.25 (desktop). Mobile uses 0.75. */
  readonly spacing?: number;
  /** When true, adds `minWidth: 0` to the outer Stack for proper text truncation. Default: false. */
  readonly compact?: boolean;
  /** Renders the avatar node (receives resolved avatar props). */
  readonly renderAvatar: (args: {
    src: string | null;
    name: string;
    fallbackInitial: string;
    size: number;
  }) => ReactNode;
};

/**
 * Shared presentational base for profile-link components.
 * Renders an avatar (via `renderAvatar`), optional label, and the entity name —
 * linking to the target page only when `href` is provided.
 */
export function ProfileLinkBase({
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
  spacing = 1.25,
  compact = false,
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
    <Stack
      direction="row"
      spacing={spacing}
      sx={{ alignItems: "center", height: "100%", ...(compact ? { minWidth: 0 } : {}) }}
    >
      {showAvatar ? renderAvatar({ src: avatarUrl ?? null, name, fallbackInitial, size: avatarSize }) : null}
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
