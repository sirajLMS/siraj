"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";
import type { OverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
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

export function OverridesDataGridDesktop({
  filteredPermissions,
  userGroups,
  localOverrides,
  mode,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverridesDataGridProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

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
          const permission = params.row;
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
          const permission = params.row;
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
