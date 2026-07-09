"use client";

import { ClassProfileLink, type ClassProfileLinkProps } from "@/frontend/components/ui/display/ClassProfileLink";

export type ClassProfileLinkCellProps = ClassProfileLinkProps;

/**
 * DataGrid-friendly wrapper around {@link ClassProfileLink} for column `renderCell`.
 */
export function ClassProfileLinkCell(props: ClassProfileLinkCellProps) {
  return <ClassProfileLink {...props} />;
}
