"use client";

import {
  DesktopClassProfileLink,
  type DesktopClassProfileLinkProps,
} from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLink.desktop";

export type DesktopClassProfileLinkCellProps = DesktopClassProfileLinkProps;

/**
 * DataGrid-friendly wrapper around {@link DesktopClassProfileLink} for column `renderCell`.
 * Explicit return type helps static analysis recognize prop forwarding via spread.
 */
export function DesktopClassProfileLinkCell(props: DesktopClassProfileLinkCellProps): React.ReactElement {
  return <DesktopClassProfileLink {...props} />;
}
