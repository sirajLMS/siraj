"use client";

import { SingleGroupViewShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupViewShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupViewShared.options";
import type { SingleGroupViewProps } from "@/frontend/common/views/dashboard/permissions/types";
import { AddPermissionsTabDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/addPermissionsTab.desktop";
import { AssignedUsersTabDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/assignedUsersTab.desktop";
import { CurrentPermissionsTabDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/currentPermissionsTab.desktop";
import { SingleGroupHeaderDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/singleGroupHeader.desktop";

export function SingleGroupViewDesktop(props: Readonly<SingleGroupViewProps>) {
  return (
    <SingleGroupViewShared
      {...props}
      options={DESKTOP_OPTIONS}
      slots={{
        SingleGroupHeader: SingleGroupHeaderDesktop,
        CurrentPermissionsTab: CurrentPermissionsTabDesktop,
        AddPermissionsTab: AddPermissionsTabDesktop,
        AssignedUsersTab: AssignedUsersTabDesktop,
      }}
    />
  );
}
