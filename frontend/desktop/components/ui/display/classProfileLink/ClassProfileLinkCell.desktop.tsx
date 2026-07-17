"use client";

import {
  DesktopClassProfileLink,
  type DesktopClassProfileLinkProps,
} from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLink.desktop";

export type DesktopClassProfileLinkCellProps = DesktopClassProfileLinkProps;

/**
 * DataGrid-friendly wrapper around {@link DesktopClassProfileLink} for column `renderCell`.
 */
export function DesktopClassProfileLinkCell(props: DesktopClassProfileLinkCellProps) {
  return <DesktopClassProfileLink {...props} />;
}
