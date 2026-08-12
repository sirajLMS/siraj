"use client";

import { ManageOverridesDialogShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/manageOverridesDialogShared";
import type { ManageOverridesDialogProps } from "@/frontend/common/views/dashboard/permissions/types";
import { OverridesDataGridDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overridesDataGrid.desktop";
import { OverridesDialogFooterDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overridesDialogFooter.desktop";
import { OverridesToolbarDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overridesToolbar.desktop";
import { OverridesUserSidebarDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overridesUserSidebar.desktop";

export function ManageOverridesDialogDesktop({ labels, ...props }: Readonly<ManageOverridesDialogProps>) {
  return (
    <ManageOverridesDialogShared
      labels={labels}
      props={props}
      slots={{
        variant: "desktop",
        dialogVariant: {
          fullWidth: true,
          maxWidth: "lg",
          slotPropsPaperSx: {
            height: "85vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
          },
        },
        formIdSuffix: "desktop",
        UserSidebar: OverridesUserSidebarDesktop,
        Toolbar: OverridesToolbarDesktop,
        DataGrid: OverridesDataGridDesktop,
        Footer: OverridesDialogFooterDesktop,
      }}
    />
  );
}
