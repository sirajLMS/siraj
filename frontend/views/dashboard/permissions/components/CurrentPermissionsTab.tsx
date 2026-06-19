"use client";

import { RemoveCircleOutlined, SecurityOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, SectionPanel } from "@/frontend/components/ui";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";

interface CurrentPermissionsTabProps {
  readonly group: PermissionGroup;
  readonly groupPermissions: readonly Permission[];
  readonly permissionsCount: number;
  readonly onRevokePermission: (permissionId: string) => Promise<void>;
  readonly onSwitchToAddTab: () => void;
}

export function CurrentPermissionsTab({
  group,
  groupPermissions,
  permissionsCount,
  onRevokePermission,
  onSwitchToAddTab,
}: Readonly<CurrentPermissionsTabProps>) {
  const t = useTranslations("dashboard.permissions");

  const currentPermissionsColumns = useMemo<GridColDef<Permission>[]>(() => {
    const cols: GridColDef<Permission>[] = [
      {
        field: "key",
        headerName: t("columnKey"),
        flex: 1,
        minWidth: 200,
        renderCell: params => (
          <Box
            sx={theme => ({
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.75rem",
              backgroundColor: theme.palette.surfaceVariant,
              color: theme.palette.onSurfaceVariant,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              display: "inline-block",
            })}
          >
            {params.value as string}
          </Box>
        ),
      },
      {
        field: "category",
        headerName: t("columnCategory"),
        width: 180,
      },
      {
        field: "description",
        headerName: t("columnDescription"),
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
          <Button
            size="small"
            startIcon={<RemoveCircleOutlined fontSize="small" />}
            onClick={() => params.row.id && onRevokePermission(params.row.id)}
            sx={theme => ({
              color: group.isSystem ? theme.palette.text.disabled : theme.palette.error.main,
              fontWeight: 600,
              fontSize: "0.75rem",
            })}
          >
            Revoke
          </Button>
        ),
      });
    }

    return cols;
  }, [t, group.isSystem, onRevokePermission]);

  return (
    <SectionPanel title={t("currentPermissions")}>
      {permissionsCount === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            textAlign: "center",
            gap: 2,
          }}
        >
          <Box
            sx={theme => ({
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: theme.palette.surfaceContainerHigh ?? theme.palette.action.hover,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${theme.palette.divider}`,
            })}
          >
            <SecurityOutlined fontSize="large" sx={theme => ({ color: theme.palette.text.secondary })} />
          </Box>
          <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
            No Permissions Assigned Yet
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, maxWidth: 400 })}>
            This custom group currently has no active policies. Add specific resource permissions to grant access to
            content modules.
          </Typography>
          {!group.isSystem && (
            <Button
              variant="contained"
              onClick={onSwitchToAddTab}
              sx={theme => ({
                bgcolor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                borderRadius: 1.5,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                },
              })}
            >
              Assign First Permission
            </Button>
          )}
        </Box>
      ) : (
        <AppDataGrid<Permission>
          rows={groupPermissions}
          columns={currentPermissionsColumns}
          getRowId={row => row.id ?? row.key ?? ""}
          emptyMessage={t("noPermissionsFound")}
          autoHeight
        />
      )}
    </SectionPanel>
  );
}
