"use client";

import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import { AddPermissionsTab } from "./AddPermissionsTab";
import { AssignedUsersTab } from "./AssignedUsersTab";
import { CurrentPermissionsTab } from "./CurrentPermissionsTab";
import { SingleGroupHeader } from "./SingleGroupHeader";

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
  readonly onUpdateGroup: (id: string, name: string, description: string, permissionIds: string[]) => Promise<void>;
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
      p => !(p.id && group.permissionIds?.includes(p.id)) && !(p.key && group.permissionIds?.includes(p.key))
    );
    const cats = available.map(p => p.category).filter((c): c is string => typeof c === "string" && c.trim() !== "");
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
  const handleRevokePermission = useCallback(
    async (permissionId: string) => {
      const groupId = group.id;
      if (!groupId) return;
      const remainingIds = (group.permissionIds ?? []).filter(id => id !== permissionId);
      await onUpdateGroup(groupId, group.name ?? "", group.description ?? "", remainingIds);
    },
    [group.id, group.permissionIds, group.name, group.description, onUpdateGroup]
  );

  // Assign checked permissions
  const handleAssignPermissions = async () => {
    const groupId = group.id;
    if (!groupId || selectedAddPermissionIds.length === 0) return;
    const updatedIds = [...(group.permissionIds ?? []), ...selectedAddPermissionIds];
    await onUpdateGroup(groupId, group.name ?? "", group.description ?? "", updatedIds);
    setSelectedAddPermissionIds([]);
    setActiveSubTab("current");
  };

  // Revoke user from group
  const handleRevokeUser = useCallback(
    async (userId: string) => {
      const groupId = group.id;
      if (!groupId) return;
      await onRevokeGroup(groupId, userId);
    },
    [group.id, onRevokeGroup]
  );

  // Bulk revoke users
  const handleBulkRevokeUsers = async () => {
    if (!group.id || selectedAssignedUserIds.length === 0) return;
    await onBulkRevoke(group.id, selectedAssignedUserIds);
    setSelectedAssignedUserIds([]);
  };

  const handleAddPermissionToggle = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedAddPermissionIds(prev => [...prev, id]);
    } else {
      setSelectedAddPermissionIds(prev => prev.filter(x => x !== id));
    }
  }, []);

  const handleAssignedUserToggle = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedAssignedUserIds(prev => [...prev, id]);
    } else {
      setSelectedAssignedUserIds(prev => prev.filter(x => x !== id));
    }
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <SingleGroupHeader group={group} onBack={onBack} onEditGroup={onEditGroup} />

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
            <Tab value="add" label={t("addPermissions")} sx={{ textTransform: "none", fontWeight: 600 }} />
          )}
          <Tab
            value="users"
            label={`${t("assignedUsers")} (${assignedUsersCount})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {!isLoading && (
        <Box sx={{ mt: 1 }}>
          {activeSubTab === "current" && (
            <CurrentPermissionsTab
              group={group}
              groupPermissions={groupPermissions}
              permissionsCount={permissionsCount}
              onRevokePermission={handleRevokePermission}
              onSwitchToAddTab={() => setActiveSubTab("add")}
            />
          )}

          {activeSubTab === "add" && !group.isSystem && (
            <AddPermissionsTab
              filteredAvailablePermissions={filteredAvailablePermissions}
              selectedAddPermissionIds={selectedAddPermissionIds}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              addCategories={addCategories}
              onAssignPermissions={handleAssignPermissions}
              onPermissionToggle={handleAddPermissionToggle}
              onSearchChange={setSearchQuery}
              onCategoryChange={setSelectedCategory}
            />
          )}

          {activeSubTab === "users" && (
            <AssignedUsersTab
              group={group}
              filteredAssignedUsers={filteredAssignedUsers}
              selectedAssignedUserIds={selectedAssignedUserIds}
              searchQuery={searchQuery}
              onBulkRevokeUsers={handleBulkRevokeUsers}
              onRevokeUser={handleRevokeUser}
              onUserToggle={handleAssignedUserToggle}
              onSearchChange={setSearchQuery}
              onAssignGroup={onAssignGroup}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
