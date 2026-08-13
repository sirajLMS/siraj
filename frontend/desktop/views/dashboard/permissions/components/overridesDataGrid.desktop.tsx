"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  StyledBaselineTextShared,
  StyledPermissionDescriptionShared,
  StyledPermissionKeyContainerShared,
  StyledPermissionKeyTextShared,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesDataGridShared.styles";
import { resolveOverrideRow } from "@/frontend/common/views/dashboard/permissions/components/__shared__/resolveOverrideRow";
import type { OverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { OverrideEditControlsDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overrideEditControls.desktop";
import { OverrideEffectiveDisplayDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overrideEffectiveDisplay.desktop";
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
  const t = labels;
  const locale = useAppLocale();

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoizing columns keeps the grid stable across re-renders.
  const columns = useMemo<GridColDef<Permission>[]>(() => {
    return [
      {
        field: "key",
        headerName: t.columnPermission,
        flex: 1,
        minWidth: 200,
        renderCell: params => {
          const permission = params.row;
          return (
            <StyledPermissionKeyContainerShared>
              <StyledPermissionKeyTextShared variant="bodyMd">{permission.key}</StyledPermissionKeyTextShared>
              <StyledPermissionDescriptionShared variant="caption">
                {permission.description}
              </StyledPermissionDescriptionShared>
            </StyledPermissionKeyContainerShared>
          );
        },
      },
      {
        field: "baseline",
        headerName: t.columnGroupBaseline,
        flex: 1.5,
        minWidth: 200,
        sortable: false,
        renderCell: params => {
          const permission = params.row;
          const { isAllowedByGroup, baselineText } = resolveOverrideRow(
            permission,
            userGroups,
            localOverrides,
            t,
            locale
          );

          return (
            <StyledBaselineTextShared variant="bodyMd" isAllowed={isAllowedByGroup}>
              {baselineText}
            </StyledBaselineTextShared>
          );
        },
      },
      {
        field: "override",
        headerName: t.columnOverrideControl,
        width: 320,
        sortable: false,
        renderCell: params => {
          const permission = params.row;
          if (!permission.id) return null;

          const { effectiveState, overrideState } = resolveOverrideRow(
            permission,
            userGroups,
            localOverrides,
            t,
            locale
          );

          if (mode === "effective") {
            return (
              <OverrideEffectiveDisplayDesktop
                labels={labels}
                effectiveState={effectiveState}
                overrideState={overrideState}
              />
            );
          }

          return (
            <OverrideEditControlsDesktop
              labels={labels}
              permissionId={permission.id}
              overrideState={overrideState}
              isDialogLoading={isDialogLoading}
              handleOverrideChange={handleOverrideChange}
            />
          );
        },
      },
    ];
  }, [t, userGroups, localOverrides, mode, isDialogLoading, handleOverrideChange, labels, locale]);

  return (
    <DesktopAppDataGrid<Permission>
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
