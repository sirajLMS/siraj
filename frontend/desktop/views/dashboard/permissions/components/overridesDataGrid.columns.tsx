import type { GridColDef } from "@mui/x-data-grid";
import type { PermissionsQuery_permissions } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  StyledBaselineTextShared,
  StyledPermissionDescriptionShared,
  StyledPermissionKeyContainerShared,
  StyledPermissionKeyTextShared,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesDataGridShared.styles";
import { resolveOverrideRow } from "@/frontend/common/views/dashboard/permissions/components/__shared__/resolveOverrideRow";
import type { OverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types/overridesDataGrid.types";
import { OverrideEditControlsDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overrideEditControls.desktop";
import { OverrideEffectiveDisplayDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overrideEffectiveDisplay.desktop";
import type { PermissionsLabels } from "@/shared/locale";

interface BuildOverridesDataGridColumnsParams {
  readonly labels: PermissionsLabels;
  readonly userGroups: OverridesDataGridProps["userGroups"];
  readonly localOverrides: OverridesDataGridProps["localOverrides"];
  readonly mode: OverridesDataGridProps["mode"];
  readonly isDialogLoading: boolean;
  readonly handleOverrideChange: OverridesDataGridProps["handleOverrideChange"];
  readonly locale: string;
}

export function buildOverridesDataGridColumns({
  labels,
  userGroups,
  localOverrides,
  mode,
  isDialogLoading,
  handleOverrideChange,
  locale,
}: Readonly<BuildOverridesDataGridColumnsParams>): GridColDef<PermissionsQuery_permissions>[] {
  return [
    {
      field: "key",
      headerName: labels.columnPermission,
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
      headerName: labels.columnGroupBaseline,
      flex: 1.5,
      minWidth: 200,
      sortable: false,
      renderCell: params => {
        const permission = params.row;
        const { isAllowedByGroup, baselineText } = resolveOverrideRow(
          permission,
          userGroups,
          localOverrides,
          labels,
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
      headerName: labels.columnOverrideControl,
      width: 320,
      sortable: false,
      renderCell: params => {
        const permission = params.row;
        if (!permission.id) return null;
        const { effectiveState, overrideState } = resolveOverrideRow(
          permission,
          userGroups,
          localOverrides,
          labels,
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
}
