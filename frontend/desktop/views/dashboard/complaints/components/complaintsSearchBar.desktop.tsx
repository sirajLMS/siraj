"use client";

import {
  ComplaintsSearchBarShared,
  type ComplaintsSearchBarSlotProps,
} from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintsSearchBarShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintsSearchBarShared.options";

export function ComplaintsSearchBarDesktop(props: Readonly<ComplaintsSearchBarSlotProps>) {
  return <ComplaintsSearchBarShared {...props} options={DESKTOP_OPTIONS} />;
}
