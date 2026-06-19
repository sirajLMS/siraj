import { useCallback } from "react";
import type { PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";

interface UseGroupMutationActionsProps {
  readonly group: PermissionGroup;
  readonly selectedAddPermissionIds: string[];
  readonly selectedAssignedUserIds: string[];
  readonly onRevokeGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onBulkRevoke: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onUpdateGroup: (id: string, name: string, description: string, permissionIds: string[]) => Promise<void>;
  readonly setActiveSubTab: (val: "current" | "add" | "users") => void;
  readonly setSelectedAddPermissionIds: React.Dispatch<React.SetStateAction<string[]>>;
  readonly setSelectedAssignedUserIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useGroupMutationActions({
  group,
  selectedAddPermissionIds,
  selectedAssignedUserIds,
  onRevokeGroup,
  onBulkRevoke,
  onUpdateGroup,
  setActiveSubTab,
  setSelectedAddPermissionIds,
  setSelectedAssignedUserIds,
}: UseGroupMutationActionsProps) {
  const handleRevokePermission = useCallback(
    async (permissionId: string) => {
      const groupId = group.id;
      if (!groupId) return;
      const remainingIds = (group.permissionIds ?? []).filter(id => id !== permissionId);
      await onUpdateGroup(groupId, group.name ?? "", group.description ?? "", remainingIds);
    },
    [group.id, group.permissionIds, group.name, group.description, onUpdateGroup]
  );

  const handleAssignPermissions = useCallback(async () => {
    const groupId = group.id;
    if (!groupId || selectedAddPermissionIds.length === 0) return;
    const updatedIds = [...(group.permissionIds ?? []), ...selectedAddPermissionIds];
    await onUpdateGroup(groupId, group.name ?? "", group.description ?? "", updatedIds);
    setSelectedAddPermissionIds([]);
    setActiveSubTab("current");
  }, [
    group.id,
    group.permissionIds,
    group.name,
    group.description,
    selectedAddPermissionIds,
    onUpdateGroup,
    setSelectedAddPermissionIds,
    setActiveSubTab,
  ]);

  const handleRevokeUser = useCallback(
    async (userId: string) => {
      const groupId = group.id;
      if (!groupId) return;
      await onRevokeGroup(groupId, userId);
    },
    [group.id, onRevokeGroup]
  );

  const handleBulkRevokeUsers = useCallback(async () => {
    if (!group.id || selectedAssignedUserIds.length === 0) return;
    await onBulkRevoke(group.id, selectedAssignedUserIds);
    setSelectedAssignedUserIds([]);
  }, [group.id, selectedAssignedUserIds, onBulkRevoke, setSelectedAssignedUserIds]);

  return {
    handleRevokePermission,
    handleAssignPermissions,
    handleRevokeUser,
    handleBulkRevokeUsers,
  };
}
