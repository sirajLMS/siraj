"use client";

import { DeleteOutlined, PersonAddOutlined, PersonRemoveOutlined, SearchOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Checkbox, InputAdornment, TextField, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, SectionPanel } from "@/frontend/components/ui";
import type { GroupUser, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";

interface AssignedUsersTabProps {
  readonly group: PermissionGroup;
  readonly filteredAssignedUsers: readonly GroupUser[];
  readonly selectedAssignedUserIds: readonly string[];
  readonly searchQuery: string;
  readonly onBulkRevokeUsers: () => void;
  readonly onRevokeUser: (userId: string) => void;
  readonly onUserToggle: (id: string, checked: boolean) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onAssignGroup: (id: string) => void;
}

export function AssignedUsersTab({
  group,
  filteredAssignedUsers,
  selectedAssignedUserIds,
  searchQuery,
  onBulkRevokeUsers,
  onRevokeUser,
  onUserToggle,
  onSearchChange,
  onAssignGroup,
}: Readonly<AssignedUsersTabProps>) {
  const t = useTranslations("dashboard.permissions");

  const assignedUsersColumns = useMemo<GridColDef<GroupUser>[]>(() => {
    return [
      {
        field: "checkbox",
        headerName: "",
        width: 50,
        sortable: false,
        renderCell: (params: { row: GroupUser }) => {
          const id = params.row.id ?? "";
          const checked = selectedAssignedUserIds.includes(id);
          return <Checkbox size="small" checked={checked} onChange={e => onUserToggle(id, e.target.checked)} />;
        },
      },
      {
        field: "name",
        headerName: t("columnName"),
        flex: 1.5,
        minWidth: 200,
        renderCell: (params: { row: GroupUser }) => {
          const user = params.row;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
              <Avatar
                sx={theme => ({
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.primaryContainer,
                  color: theme.palette.onPrimaryContainer,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                })}
              >
                {user.name
                  ?.split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Typography
                  variant="bodyMd"
                  sx={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.name}
                </Typography>
                <Typography
                  variant="bodyMd"
                  sx={theme => ({
                    color: theme.palette.text.secondary,
                    fontSize: "0.75rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  })}
                >
                  {user.email}
                </Typography>
              </Box>
            </Box>
          );
        },
      },
      {
        field: "assignedDate",
        headerName: "Assigned Date",
        flex: 1.2,
        minWidth: 150,
        renderCell: () => {
          const date = group.createdAt ? new Date(group.createdAt) : new Date();
          return (
            <Typography variant="bodyMd">
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Typography>
          );
        },
      },
      {
        field: "assignedBy",
        headerName: "Assigned By",
        flex: 1,
        minWidth: 120,
        renderCell: () => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            System
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "",
        width: 100,
        align: "right",
        sortable: false,
        renderCell: params => (
          <Button
            size="small"
            color="error"
            startIcon={<PersonRemoveOutlined fontSize="small" />}
            onClick={() => params.row.id && onRevokeUser(params.row.id)}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          >
            Remove
          </Button>
        ),
      },
    ];
  }, [t, group.createdAt, selectedAssignedUserIds, onRevokeUser, onUserToggle]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box
        sx={theme => ({
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
        })}
      >
        <TextField
          size="small"
          placeholder="Search assigned users by name or email..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: { xs: "100%", sm: 360 } }}
        />
        <Button
          variant="contained"
          startIcon={<PersonAddOutlined />}
          onClick={() => group.id && onAssignGroup(group.id)}
          sx={theme => ({
            bgcolor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            textTransform: "none",
            borderRadius: 1.5,
            fontWeight: 600,
            width: { xs: "100%", sm: "auto" },
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
            },
          })}
        >
          Assign Users
        </Button>
      </Box>

      {selectedAssignedUserIds.length > 0 && (
        <Box
          sx={theme => ({
            p: 2,
            borderRadius: 1.5,
            bgcolor: theme.palette.errorContainer ?? "rgba(211, 47, 47, 0.15)",
            color: theme.palette.onErrorContainer ?? theme.palette.error.main,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: 2,
          })}
        >
          <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
            {selectedAssignedUserIds.length} users selected
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteOutlined />}
            onClick={onBulkRevokeUsers}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 1.5,
            }}
          >
            Remove Selected
          </Button>
        </Box>
      )}

      <SectionPanel title="Assigned Group Members">
        <AppDataGrid<GroupUser>
          rows={filteredAssignedUsers}
          columns={assignedUsersColumns}
          getRowId={row => row.id ?? row.email ?? ""}
          emptyMessage="No users are currently assigned to this permission group."
          autoHeight
        />
      </SectionPanel>
    </Box>
  );
}
