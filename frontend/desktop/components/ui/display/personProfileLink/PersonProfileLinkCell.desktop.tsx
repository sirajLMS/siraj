"use client";

import {
  DesktopPersonProfileLink,
  type DesktopPersonProfileLinkProps,
} from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLink.desktop";

export type DesktopPersonProfileLinkCellProps = DesktopPersonProfileLinkProps;

/**
 * DataGrid-friendly wrapper around {@link DesktopPersonProfileLink} for column `renderCell`.
 */
export function DesktopPersonProfileLinkCell(props: DesktopPersonProfileLinkCellProps) {
  return <DesktopPersonProfileLink {...props} />;
}
