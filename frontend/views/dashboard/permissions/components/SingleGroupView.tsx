"use client";

import {
  ArrowBackOutlined,
  DeleteOutlined,
  EditOutlined,
  PersonAddOutlined,
  PersonRemoveOutlined,
  RemoveCircleOutlined,
  SearchOutlined,
  SecurityOutlined,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AppDataGrid, SectionPanel, StatusBadge } from "@/frontend/components/ui";
import type { GroupUser, Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";

interface SingleGroupViewProps {
  readonly group: PermissionGroup;
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly onBack: () => void;
  readonly onEditGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
  readonly onRevokeGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onBulkAssign: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onBulkRevoke: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onUpdateGroup: (
    id: string,
    name: string,
    description: string,
    permissionIds: string[]
  ) => Promise<void>;
}

type SubTabKey = "current" | "add" | "users";

export function SingleGroupView({
  group,
  permissions,
  isLoading,
  onBack,
  onEditGroup,
  onAssignGroup,
  onRevokeGroup,
  onBulkRevoke,
  onUpdateGroup,
}: Readonly<SingleGroupViewProps>) {
  const t = useTranslations("dashboard.permissions");
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>("current");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Selection states for add permission & user grid
  const [selectedAddPermissionIds, setSelectedAddPermissionIds] = useState<string[]>([]);
  const [selectedAssignedUserIds, setSelectedAssignedUserIds] = useState<string[]>([]);

  // Resolve the permissions currently in this group
  const groupPermissions = useMemo(() => {
    const ids = group.permissionIds ?? [];
    return permissions.filter(p => p.id && ids.includes(p.id));
  }, [permissions, group.permissionIds]);

  // Categories for filtering in Add Permission tab
  const addCategories = useMemo(() => {
    const available = permissions.filter(
      p => !group.permissionIds?.includes(p.id!) && !group.permissionIds?.includes(p.key!)
    );
    const cats = available
      .map(p => p.category)
      .filter((c): c is string => typeof c === "string" && c.trim() !== "");
    return Array.from(new Set(cats));
  }, [permissions, group.permissionIds]);

  // Filtered available permissions to add
  const filteredAvailablePermissions = useMemo(() => {
    const ids = group.permissionIds ?? [];
    const available = permissions.filter(p => p.id && !ids.includes(p.id));

    return available.filter(p => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.key?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [permissions, group.permissionIds, selectedCategory, searchQuery]);

  // Filtered assigned users to display
  const filteredAssignedUsers = useMemo(() => {
    const assigned = group.assignedUsers ?? [];
    const query = searchQuery.trim().toLowerCase();

    if (!query) return assigned;

    return assigned.filter(
      u =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.id?.toLowerCase().includes(query)
    );
  }, [group.assignedUsers, searchQuery]);

  // Total permissions count
  const permissionsCount = groupPermissions.length;
  // Total assigned users count
  const assignedUsersCount = group.assignedUsers?.length ?? 0;

  // Revoke permission from group
  const handleRevokePermission = async (permissionId: string) => {
    if (!group.id) return;
    const remainingIds = (group.permissionIds ?? []).filter(id => id !== permissionId);
    await onUpdateGroup(group.id!, group.name ?? "", group.description ?? "", remainingIds);
  };

  // Assign checked permissions
  const handleAssignPermissions = async () => {
    if (!group.id || selectedAddPermissionIds.length === 0) return;
    const updatedIds = [...(group.permissionIds ?? []), ...selectedAddPermissionIds];
    await onUpdateGroup(group.id!, group.name ?? "", group.description ?? "", updatedIds);
    setSelectedAddPermissionIds([]);
    setActiveSubTab("current");
  };

  // Revoke user from group
  const handleRevokeUser = async (userId: string) => {
    if (!group.id) return;
    await onRevokeGroup(group.id, userId);
  };

  // Bulk revoke users
  const handleBulkRevokeUsers = async () => {
    if (!group.id || selectedAssignedUserIds.length === 0) return;
    await onBulkRevoke(group.id, selectedAssignedUserIds);
    setSelectedAssignedUserIds([]);
  };

  // Definition of current permissions columns
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
            onClick={() => handleRevokePermission(params.row.id!)}
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
  }, [t, group.isSystem, onUpdateGroup, group.id, group.name, group.description, group.permissionIds]);

  // Definition of Add Permissions columns
  const addPermissionsColumns = useMemo<GridColDef<Permission>[]>(() => {
    return [
      {
        field: "checkbox",
        headerName: "",
        width: 50,
        sortable: false,
        renderCell: params => {
          const id = params.row.id!;
          const checked = selectedAddPermissionIds.includes(id);
          return (
            <Checkbox
              size="small"
              checked={checked}
              onChange={e => {
                if (e.target.checked) {
                  setSelectedAddPermissionIds(prev => [...prev, id]);
                } else {
                  setSelectedAddPermissionIds(prev => prev.filter(x => x !== id));
                }
              }}
            />
          );
        },
      },
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
  }, [t, selectedAddPermissionIds]);

  // Definition of Assigned Users columns
  const assignedUsersColumns = useMemo<GridColDef<GroupUser>[]>(() => {
    return [
      {
        field: "checkbox",
        headerName: "",
        width: 50,
        sortable: false,
        renderCell: params => {
          const id = params.row.id!;
          const checked = selectedAssignedUserIds.includes(id);
          return (
            <Checkbox
              size="small"
              checked={checked}
              onChange={e => {
                if (e.target.checked) {
                  setSelectedAssignedUserIds(prev => [...prev, id]);
                } else {
                  setSelectedAssignedUserIds(prev => prev.filter(x => x !== id));
                }
              }}
            />
          );
        },
      },
      {
        field: "name",
        headerName: t("columnName"),
        flex: 1.5,
        minWidth: 200,
        renderCell: params => {
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
                {user.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
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
          // Default to group creation date
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
            onClick={() => handleRevokeUser(params.row.id!)}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          >
            Remove
          </Button>
        ),
      },
    ];
  }, [t, group.createdAt, selectedAssignedUserIds]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Breadcrumbs & Navigation */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          onClick={onBack}
          size="small"
          variant="text"
          startIcon={<ArrowBackOutlined />}
          sx={theme => ({
            color: theme.palette.text.secondary,
            textTransform: "none",
            fontSize: "0.875rem",
            "&:hover": {
              bgcolor: "transparent",
              color: theme.palette.primary.main,
            },
          })}
        >
          {t("groupsTab")}
        </Button>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.disabled })}>
          /
        </Typography>
        <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
          {group.name}
        </Typography>
      </Box>

      {/* Main Single Group Header Panel */}
      <Box
        sx={theme => ({
          p: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2.5,
        })}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="headlineMd" sx={{ fontWeight: 600 }}>
              {group.name}
            </Typography>
            <StatusBadge
              category="session"
              status={group.isSystem ? "active" : "pending"}
              label={group.isSystem ? t("systemBadge") : t("customBadge")}
            />
          </Box>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {group.description || "No description provided."}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignSelf: { xs: "stretch", md: "center" } }}>
          <Button
            variant="outlined"
            onClick={onBack}
            sx={theme => ({
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              textTransform: "none",
              borderRadius: 1.5,
              fontWeight: 600,
            })}
          >
            Back to All Groups
          </Button>
          {!group.isSystem && (
            <Button
              variant="contained"
              startIcon={<EditOutlined fontSize="small" />}
              onClick={() => onEditGroup(group.id!)}
              sx={theme => ({
                bgcolor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                textTransform: "none",
                borderRadius: 1.5,
                fontWeight: 600,
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                },
              })}
            >
              Edit Group Details
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs Menu */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeSubTab}
          onChange={(_, val: SubTabKey) => {
            setActiveSubTab(val);
            setSearchQuery("");
            setSelectedCategory("all");
            setSelectedAddPermissionIds([]);
            setSelectedAssignedUserIds([]);
          }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            value="current"
            label={`${t("currentPermissions")} (${permissionsCount})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          {!group.isSystem && (
            <Tab
              value="add"
              label={t("addPermissions")}
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          )}
          <Tab
            value="users"
            label={`${t("assignedUsers")} (${assignedUsersCount})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {/* Loading state indicator */}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Tab Panels */}
      {!isLoading && (
        <Box sx={{ mt: 1 }}>
          {/* 1. CURRENT PERMISSIONS TAB */}
          {activeSubTab === "current" && (
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
                    This custom group currently has no active policies. Add specific resource permissions to grant access to content modules.
                  </Typography>
                  {!group.isSystem && (
                    <Button
                      variant="contained"
                      onClick={() => setActiveSubTab("add")}
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
          )}

          {/* 2. ADD PERMISSIONS TAB */}
          {activeSubTab === "add" && !group.isSystem && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Filter controls */}
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
                  placeholder={t("searchPermissionsPlaceholder")}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
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
                <Select
                  size="small"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  sx={{ width: { xs: "100%", sm: 200 } }}
                >
                  <MenuItem value="all">{t("allCategoriesOption")}</MenuItem>
                  {addCategories.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Bulk Action Bar */}
              {selectedAddPermissionIds.length > 0 && (
                <Box
                  sx={theme => ({
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: theme.palette.primaryContainer,
                    color: theme.palette.onPrimaryContainer,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: 2,
                  })}
                >
                  <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
                    {t("itemsSelectedLabel", { count: selectedAddPermissionIds.length })}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleAssignPermissions}
                    sx={theme => ({
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.onPrimary,
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 1.5,
                      "&:hover": {
                        bgcolor: theme.palette.primary.dark,
                      },
                    })}
                  >
                    {t("assignPermissionsButton")}
                  </Button>
                </Box>
              )}

              {/* Addable catalog grid */}
              <SectionPanel title={t("addPermissions")}>
                <AppDataGrid<Permission>
                  rows={filteredAvailablePermissions}
                  columns={addPermissionsColumns}
                  getRowId={row => row.id ?? row.key ?? ""}
                  emptyMessage={t("noPermissionsFound")}
                  autoHeight
                />
              </SectionPanel>
            </Box>
          )}

          {/* 3. ASSIGNED USERS TAB */}
          {activeSubTab === "users" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Toolbar */}
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
                  onChange={e => setSearchQuery(e.target.value)}
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
                  onClick={() => onAssignGroup(group.id!)}
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

              {/* Bulk Action Bar */}
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
                    onClick={handleBulkRevokeUsers}
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

              {/* Assigned Users Grid */}
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
          )}
        </Box>
      )}
    </Box>
  );
}
