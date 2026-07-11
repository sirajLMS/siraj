"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, GridPagination } from "@/frontend/components/ui";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import { OverrideEditControls } from "@/frontend/views/dashboard/permissions/components/OverrideEditControls";
import { OverrideEffectiveDisplay } from "@/frontend/views/dashboard/permissions/components/OverrideEffectiveDisplay";

export type OverrideState = "GRANTED" | "DENIED" | "INHERIT";

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

interface OverridesDataGridProps {
  readonly filteredPermissions: readonly Permission[];
  readonly userGroups: readonly PermissionGroup[];
  readonly localOverrides: Record<string, OverrideState>;
  readonly mode: "effective" | "edit";
  readonly isDialogLoading: boolean;
  readonly handleOverrideChange: (permissionId: string, state: OverrideState) => void;
}

export function OverridesDataGrid({
  filteredPermissions,
  userGroups,
  localOverrides,
  mode,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverridesDataGridProps>) {
  const t = useTranslations("dashboard.permissions");

  const columns = useMemo<GridColDef<Permission>[]>(() => {
    return [
      {
        field: "key",
        headerName: t("columnPermission"),
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
        headerName: t("columnGroupBaseline"),
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
            ? t("allowedViaGroups", { groups: baselineGroups.map(g => g.name).join(", ") })
            : t("notSet");

          return (
            <StyledBaselineText variant="bodyMd" isAllowed={isAllowedByGroup}>
              {baselineText}
            </StyledBaselineText>
          );
        },
      },
      {
        field: "override",
        headerName: t("columnOverrideControl"),
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
            return <OverrideEffectiveDisplay effectiveState={effectiveState} overrideState={overrideState} />;
          }

          return (
            <OverrideEditControls
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
    <AppDataGrid<Permission>
      rows={filteredPermissions as Permission[]}
      columns={columns}
      getRowId={row => row.id ?? row.key ?? ""}
      loading={isDialogLoading && filteredPermissions.length === 0}
      slots={{ pagination: GridPagination }}
      autoHeight
      ariaLabel="permissions overrides table"
    />
  );
}
