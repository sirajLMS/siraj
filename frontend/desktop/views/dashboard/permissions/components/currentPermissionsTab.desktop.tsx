"use client";

import { RemoveCircleOutlined, SecurityOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, SectionPanel } from "@/frontend/common/components/ui";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppTranslation } from "@/shared/locale";

const StyledPermissionKeyCell = styled(Box)(({ theme }) => ({
  fontFamily: "JetBrains Mono, monospace",
  typography: "labelMd",
  backgroundColor: theme.palette.surfaceVariant,
  color: theme.palette.onSurfaceVariant,
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  borderRadius: theme.shape.borderRadius,
  display: "inline-block",
}));

const StyledRevokeButton = styled(Button)(({ theme }) => ({
  color: theme.palette.error.main,
  fontWeight: 600,
  typography: "labelMd",
}));

const StyledEmptyStateContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
  textAlign: "center",
  gap: theme.spacing(2),
}));

const StyledEmptyStateIconCircle = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  borderRadius: "50%",
  backgroundColor: theme.palette.surfaceContainerHigh ?? theme.palette.action.hover,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledEmptyStateTitle = styled(Typography)({
  fontWeight: 600,
});

const StyledEmptyStateDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  maxWidth: 400,
}));

const StyledAssignFirstButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  textTransform: "none",
  fontWeight: 600,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

interface CurrentPermissionsTabDesktopProps {
  readonly group: PermissionGroup;
  readonly groupPermissions: readonly Permission[];
  readonly permissionsCount: number;
  readonly onRevokePermission: (permissionId: string) => Promise<void>;
  readonly onSwitchToAddTab: () => void;
  readonly loading?: boolean;
}

export function CurrentPermissionsTabDesktop({
  group,
  groupPermissions,
  permissionsCount,
  onRevokePermission,
  onSwitchToAddTab,
  loading = false,
}: Readonly<CurrentPermissionsTabDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  const currentPermissionsColumns = useMemo<GridColDef<Permission>[]>(() => {
    const cols: GridColDef<Permission>[] = [
      {
        field: "key",
        headerName: t.columnKey,
        flex: 1,
        minWidth: 200,
        renderCell: params => <StyledPermissionKeyCell>{params.value as string}</StyledPermissionKeyCell>,
      },
      {
        field: "category",
        headerName: t.columnCategory,
        width: 180,
      },
      {
        field: "description",
        headerName: t.columnDescription,
        flex: 1.5,
        minWidth: 250,
      },
    ];

    if (!group.isSystem) {
      cols.push({
        field: "actions",
        headerName: "",
        width: 100,
        align: "right",
        sortable: false,
        renderCell: params => (
          <StyledRevokeButton
            size="small"
            startIcon={<RemoveCircleOutlined fontSize="small" />}
            onClick={() => params.row.id && onRevokePermission(params.row.id)}
          >
            {t.revoke}
          </StyledRevokeButton>
        ),
      });
    }

    return cols;
  }, [t, group.isSystem, onRevokePermission]);

  return (
    <SectionPanel title={t.currentPermissions}>
      {permissionsCount === 0 && !loading ? (
        <StyledEmptyStateContainer>
          <StyledEmptyStateIconCircle>
            <SecurityOutlined fontSize="large" sx={theme => ({ color: theme.palette.text.secondary })} />
          </StyledEmptyStateIconCircle>
          <StyledEmptyStateTitle variant="titleLg">{t.noPermissionsAssignedYet}</StyledEmptyStateTitle>
          <StyledEmptyStateDescription variant="bodyMd">{t.noPermissionsDescription}</StyledEmptyStateDescription>
          {!group.isSystem && (
            <StyledAssignFirstButton variant="contained" onClick={onSwitchToAddTab}>
              {t.assignFirstPermission}
            </StyledAssignFirstButton>
          )}
        </StyledEmptyStateContainer>
      ) : (
        <AppDataGrid<Permission>
          rows={groupPermissions}
          columns={currentPermissionsColumns}
          getRowId={row => row.id ?? row.key ?? ""}
          emptyMessage={t.noPermissionsFound}
          loading={loading}
          autoHeight
        />
      )}
    </SectionPanel>
  );
}
