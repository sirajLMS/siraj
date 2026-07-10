import { useCallback, useState } from "react";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import type { LocalizedString } from "@/frontend/types/localized-string.types";
import { useGroupMutationActions } from "@/frontend/views/dashboard/permissions/components/useGroupMutationActions";
import { useGroupPermissionFilters } from "@/frontend/views/dashboard/permissions/components/useGroupPermissionFilters";

export type SubTabKey = "current" | "add" | "users";

interface UseSingleGroupStateProps {
  readonly group: PermissionGroup;
  readonly permissions: readonly Permission[];
  readonly onRevokeGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onBulkRevoke: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onUpdateGroup: (
    id: string,
    name: LocalizedString,
    description: LocalizedString,
    permissionIds: string[]
  ) => Promise<void>;
}

export function useSingleGroupState({
  group,
  permissions,
  onRevokeGroup,
  onBulkRevoke,
  onUpdateGroup,
}: UseSingleGroupStateProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAddPermissionIds, setSelectedAddPermissionIds] = useState<string[]>([]);
  const [selectedAssignedUserIds, setSelectedAssignedUserIds] = useState<string[]>([]);

  const filters = useGroupPermissionFilters({ group, permissions, searchQuery, selectedCategory });

  const mutationActions = useGroupMutationActions({
    group,
    selectedAddPermissionIds,
    selectedAssignedUserIds,
    onRevokeGroup,
    onBulkRevoke,
    onUpdateGroup,
    setActiveSubTab,
    setSelectedAddPermissionIds,
    setSelectedAssignedUserIds,
  });

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

  const handleSubTabChange = useCallback((val: SubTabKey) => {
    setActiveSubTab(val);
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedAddPermissionIds([]);
    setSelectedAssignedUserIds([]);
  }, []);

  return {
    activeSubTab,
    setActiveSubTab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedAddPermissionIds,
    selectedAssignedUserIds,
    ...filters,
    ...mutationActions,
    handleAddPermissionToggle,
    handleAssignedUserToggle,
    handleSubTabChange,
  };
}
