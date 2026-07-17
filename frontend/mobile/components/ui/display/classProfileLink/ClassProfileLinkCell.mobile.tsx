"use client";

import {
  MobileClassProfileLink,
  type MobileClassProfileLinkProps,
} from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";

export type MobileClassProfileLinkCellProps = MobileClassProfileLinkProps;

/**
 * DataGrid-friendly wrapper around {@link MobileClassProfileLink} for column `renderCell`.
 */
export function MobileClassProfileLinkCell(props: MobileClassProfileLinkCellProps) {
  return <MobileClassProfileLink {...props} />;
}
