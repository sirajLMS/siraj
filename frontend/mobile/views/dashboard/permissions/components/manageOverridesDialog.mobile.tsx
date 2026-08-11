"use client";

import { ManageOverridesDialogShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/manageOverridesDialogShared";
import type { ManageOverridesDialogProps } from "@/frontend/common/views/dashboard/permissions/types";
import { OverridesDataGridMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overridesDataGrid.mobile";
import { OverridesDialogFooterMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overridesDialogFooter.mobile";
import { OverridesToolbarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overridesToolbar.mobile";
import { OverridesUserSidebarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overridesUserSidebar.mobile";

export function ManageOverridesDialogMobile({ labels, ...props }: Readonly<ManageOverridesDialogProps>) {
  return (
    <ManageOverridesDialogShared
      labels={labels}
      props={props}
      slots={{
        variant: "mobile",
        dialogVariant: { fullScreen: true },
        formIdSuffix: "mobile",
        UserSidebar: OverridesUserSidebarMobile,
        Toolbar: OverridesToolbarMobile,
        DataGrid: OverridesDataGridMobile,
        Footer: OverridesDialogFooterMobile,
      }}
    />
  );
}
