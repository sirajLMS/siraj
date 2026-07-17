"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid";
import { DesktopGridPagination } from "@/frontend/desktop/components/ui/filter";
import { OverrideEditControlsDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overrideEditControls.desktop";
import { OverrideEffectiveDisplayDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overrideEffectiveDisplay.desktop";
import { useAppTranslation } from "@/shared/locale";

export type { OverrideState };

const StyledPermissionKeyContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
});

const StyledPermissionKeyText = styled(Typography)(({ theme }) => ({
  fontFamily: "JetBrains Mono, monospace",
  fontSize: theme.typography.labelMd.fontSize,
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

const StyledPermissionDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

const StyledBaselineText = styled(Typography, {
  shouldForwardProp: prop => prop !== "isAllowed",
})<{ isAllowed: boolean }>(({ theme, isAllowed }) => ({
  color: isAllowed ? theme.palette.success.main : theme.palette.text.secondary,
}));

interface OverridesDataGridDesktopProps {
  readonly filteredPermissions: readonly Permission[];
  readonly userGroups: readonly PermissionGroup[];
  readonly localOverrides: Record<string, OverrideState>;
  readonly mode: "effective" | "edit";
  readonly isDialogLoading: boolean;
  readonly handleOverrideChange: (permissionId: string, state: OverrideState) => void;
}

export function OverridesDataGridDesktop({
  filteredPermissions,
  userGroups,
  localOverrides,
  mode,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverridesDataGridDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  const columns = useMemo<GridColDef<Permission>[]>(() => {
    return [
      {
        field: "key",
        headerName: t.columnPermission,
        flex: 1,
        minWidth: 200,
        renderCell: params => {
          const permission = params.row as Permission;
          return (
            <StyledPermissionKeyContainer>
              <StyledPermissionKeyText variant="bodyMd">{permission.key}</StyledPermissionKeyText>
              <StyledPermissionDescription variant="caption">{permission.description}</StyledPermissionDescription>
            </StyledPermissionKeyContainer>
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
          const permission = params.row as Permission;
          const baselineGroups = userGroups.filter(
            g =>
              (permission.id && g.permissionIds?.includes(permission.id)) ||
              (permission.key && g.permissionIds?.includes(permission.key))
          );
          const isAllowedByGroup = baselineGroups.length > 0;
          const baselineText = isAllowedByGroup
            ? t.allowedViaGroups(baselineGroups.map(g => g.name).join(", "))
            : t.notSet;

          return (
            <StyledBaselineText variant="bodyMd" isAllowed={isAllowedByGroup}>
              {baselineText}
            </StyledBaselineText>
          );
        },
      },
      {
        field: "override",
        headerName: t.columnOverrideControl,
        width: 320,
        sortable: false,
        renderCell: params => {
          const permission = params.row as Permission;
          if (!permission.id) return null;

          const baselineGroups = userGroups.filter(
            g =>
              (permission.id && g.permissionIds?.includes(permission.id)) ||
              (permission.key && g.permissionIds?.includes(permission.key))
          );
          const isAllowedByGroup = baselineGroups.length > 0;
          const overrideState: OverrideState = localOverrides[permission.id] || "INHERIT";

          let effectiveState: "allowed" | "denied" | "not_set";
          if (overrideState === "GRANTED") {
            effectiveState = "allowed";
          } else if (overrideState === "DENIED") {
            effectiveState = "denied";
          } else if (isAllowedByGroup) {
            effectiveState = "allowed";
          } else {
            effectiveState = "not_set";
          }

          if (mode === "effective") {
            return <OverrideEffectiveDisplayDesktop effectiveState={effectiveState} overrideState={overrideState} />;
          }

          return (
            <OverrideEditControlsDesktop
              permissionId={permission.id}
              overrideState={overrideState}
              isDialogLoading={isDialogLoading}
              handleOverrideChange={handleOverrideChange}
            />
          );
        },
      },
    ];
  }, [t, userGroups, localOverrides, mode, isDialogLoading, handleOverrideChange]);

  return (
    <DesktopAppDataGrid<Permission>
      rows={filteredPermissions as Permission[]}
      columns={columns}
      getRowId={row => row.id ?? row.key ?? ""}
      loading={isDialogLoading && filteredPermissions.length === 0}
      slots={{ pagination: DesktopGridPagination }}
      autoHeight
      ariaLabel="permissions overrides table"
    />
  );
}
