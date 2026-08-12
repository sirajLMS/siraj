"use client";

import {
  ComplaintsSearchBarShared,
  type ComplaintsSearchBarSlotProps,
} from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintsSearchBarShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintsSearchBarShared.options";

export function ComplaintsSearchBarMobile(props: Readonly<ComplaintsSearchBarSlotProps>) {
  return <ComplaintsSearchBarShared {...props} options={MOBILE_OPTIONS} />;
}
