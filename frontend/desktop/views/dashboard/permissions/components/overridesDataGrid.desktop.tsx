"use client";

import { useMemo } from "react";
import type { PermissionsQuery_permissions } from "@/frontend/common/graphql/generated/gql/graphql";
import type { OverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { buildOverridesDataGridColumns } from "@/frontend/desktop/views/dashboard/permissions/components/overridesDataGrid.columns";
import { useAppLocale } from "@/shared/locale";

export function OverridesDataGridDesktop({
  labels,
  filteredPermissions,
  userGroups,
  localOverrides,
  mode,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverridesDataGridProps>) {
  const locale = useAppLocale();

  const columns = useMemo(
    () =>
      buildOverridesDataGridColumns({
        labels,
        userGroups,
        localOverrides,
        mode,
        isDialogLoading,
        handleOverrideChange,
        locale,
      }),
    [labels, userGroups, localOverrides, mode, isDialogLoading, handleOverrideChange, locale]
  );

  return (
    <DesktopAppDataGrid<PermissionsQuery_permissions>
      rows={filteredPermissions}
      columns={columns}
      getRowId={row => row.id ?? row.key ?? ""}
      loading={isDialogLoading && filteredPermissions.length === 0}
      paginationOptions={{ mode: "client" }}
      autoHeight
      ariaLabel="permissions overrides table"
    />
  );
}
