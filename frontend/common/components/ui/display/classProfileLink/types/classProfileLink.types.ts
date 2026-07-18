// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/classProfileLink/ClassProfileLink.{mobile,desktop}.tsx)
import type { TypographyProps } from "@mui/material/Typography";

export type ClassProfileLinkProps = {
  readonly href?: string | null;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly showAvatar?: boolean;
  readonly avatarSize?: number;
  readonly fallbackInitial?: string;
  readonly label?: string;
  /** Wider than `TypographyProps["variant"]` to admit custom theme variants like `bodySm`. */
  readonly typographyVariant?: TypographyProps["variant"] | (string & {});
  readonly fontWeight?: number;
  /** When true, use primary color for the name (linked look). Default true when href is set. */
  readonly emphasizeLink?: boolean;
};
