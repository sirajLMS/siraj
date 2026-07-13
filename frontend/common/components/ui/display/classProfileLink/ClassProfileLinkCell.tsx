"use client";

import {
  ClassProfileLink,
  type ClassProfileLinkProps,
} from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLink";

export type ClassProfileLinkCellProps = ClassProfileLinkProps;

/**
 * DataGrid-friendly wrapper around {@link ClassProfileLink} for column `renderCell`.
 */
export function ClassProfileLinkCell(props: ClassProfileLinkCellProps) {
  return <ClassProfileLink {...props} />;
}
