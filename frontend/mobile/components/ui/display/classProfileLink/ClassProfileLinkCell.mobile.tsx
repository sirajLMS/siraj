"use client";

import {
  MobileClassProfileLink,
  type MobileClassProfileLinkProps,
} from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";

/**
 * DataGrid-friendly wrapper around {@link MobileClassProfileLink} for column `renderCell`.
 */
export function MobileClassProfileLinkCell(props: MobileClassProfileLinkProps) {
  return <MobileClassProfileLink {...props} />;
}
