"use client";

import {
  MobilePersonProfileLink,
  type MobilePersonProfileLinkProps,
} from "@/frontend/mobile/components/ui/display/personProfileLink/PersonProfileLink.mobile";

export type MobilePersonProfileLinkCellProps = MobilePersonProfileLinkProps;

/**
 * DataGrid-friendly wrapper around {@link MobilePersonProfileLink} for column `renderCell`.
 */
export function MobilePersonProfileLinkCell(props: MobilePersonProfileLinkCellProps) {
  return <MobilePersonProfileLink {...props} />;
}
