"use client";

import { SingleGroupViewShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupViewShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupViewShared.options";
import type { SingleGroupViewProps } from "@/frontend/common/views/dashboard/permissions/types";
import { AddPermissionsTabMobile } from "@/frontend/mobile/views/dashboard/permissions/components/addPermissionsTab.mobile";
import { AssignedUsersTabMobile } from "@/frontend/mobile/views/dashboard/permissions/components/assignedUsersTab.mobile";
import { CurrentPermissionsTabMobile } from "@/frontend/mobile/views/dashboard/permissions/components/currentPermissionsTab.mobile";
import { SingleGroupHeaderMobile } from "@/frontend/mobile/views/dashboard/permissions/components/singleGroupHeader.mobile";

export function SingleGroupViewMobile(props: Readonly<SingleGroupViewProps>) {
  return (
    <SingleGroupViewShared
      {...props}
      options={MOBILE_OPTIONS}
      slots={{
        SingleGroupHeader: SingleGroupHeaderMobile,
        CurrentPermissionsTab: CurrentPermissionsTabMobile,
        AddPermissionsTab: AddPermissionsTabMobile,
        AssignedUsersTab: AssignedUsersTabMobile,
      }}
    />
  );
}
