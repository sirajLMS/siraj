"use client";

import {
  AssignedUsersBulkActionBar,
  AssignedUsersTabShared,
} from "@/frontend/common/views/dashboard/permissions/components/assignedUsersTabShared";
import type { AssignedUsersTabProps } from "@/frontend/common/views/dashboard/permissions/types/assignedUsersTab.types";
import { assignedUsersTabLabels } from "@/frontend/common/views/dashboard/permissions/utils";
import {
  AssignedUsersMobileList,
  AssignedUsersToolbar,
} from "@/frontend/mobile/views/dashboard/permissions/components/assignedUsersTabList.mobile.parts";

export function AssignedUsersTabMobile(props: Readonly<AssignedUsersTabProps>) {
  return (
    <AssignedUsersTabShared
      props={props}
      slots={{
        Toolbar: AssignedUsersToolbar,
        BulkActionBar: AssignedUsersBulkActionBar,
        UsersList: AssignedUsersMobileList,
      }}
      labels={assignedUsersTabLabels(props.labels)}
    />
  );
}
