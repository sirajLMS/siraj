"use client";

import { SingleGroupHeaderShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared.options";
import type { SingleGroupHeaderProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileFilterButton, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";

export function SingleGroupHeaderMobile(props: Readonly<SingleGroupHeaderProps>) {
  return (
    <SingleGroupHeaderShared
      {...props}
      options={MOBILE_OPTIONS}
      slots={{ StatusBadge: MobileStatusBadge, backButton: MobileFilterButton, editButton: MobilePrimaryPageAction }}
    />
  );
}
