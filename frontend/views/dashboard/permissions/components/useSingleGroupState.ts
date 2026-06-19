import { useState } from "react";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import { useGroupActions } from "./useGroupActions";
import { useGroupPermissionFilters } from "./useGroupPermissionFilters";

export type SubTabKey = "current" | "add" | "users";

interface UseSingleGroupStateProps {
  readonly group: PermissionGroup;
  readonly permissions: readonly Permission[];
  readonly onRevokeGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onBulkRevoke: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onUpdateGroup: (id: string, name: string, description: string, permissionIds: string[]) => Promise<void>;
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

  const actions = useGroupActions({
    group,
    selectedAddPermissionIds,
    selectedAssignedUserIds,
    onRevokeGroup,
    onBulkRevoke,
    onUpdateGroup,
    setActiveSubTab,
    setSelectedAddPermissionIds,
    setSelectedAssignedUserIds,
    setSearchQuery,
    setSelectedCategory,
  });

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
    ...actions,
  };
}
