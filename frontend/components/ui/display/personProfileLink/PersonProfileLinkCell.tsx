"use client";

import {
  PersonProfileLink,
  type PersonProfileLinkProps,
} from "@/frontend/components/ui/display/personProfileLink/PersonProfileLink";

export type PersonProfileLinkCellProps = PersonProfileLinkProps;

/**
 * DataGrid-friendly wrapper around {@link PersonProfileLink} for column `renderCell`.
 */
export function PersonProfileLinkCell(props: PersonProfileLinkCellProps) {
  return <PersonProfileLink {...props} />;
}
