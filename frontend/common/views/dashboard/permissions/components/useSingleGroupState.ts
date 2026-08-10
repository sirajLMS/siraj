import { useCallback, useState } from "react";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useGroupMutationActions } from "@/frontend/common/views/dashboard/permissions/components/useGroupMutationActions";
import { useGroupPermissionFilters } from "@/frontend/common/views/dashboard/permissions/components/useGroupPermissionFilters";
import type { LocalizedString } from "@/shared/types";

export type SubTabKey = "current" | "add" | "users";

interface UseSingleGroupStateProps {
  // NEW FOR PLAN v5: nullable so the ViewModel can call the hook unconditionally
  // (rules-of-hooks) when no group is active — the consumer only reads the
  // returned state when `group` is non-null.
  readonly group: PermissionGroup | null;
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

/**
 * Owns the single-group sub-view state (active sub-tab, search/category filter,
 * per-tab selection sets) plus the derived filters/mutation actions for the
 * `SingleGroupView{Mobile,Desktop}` components.
 *
 * Per specs §6.2 the ViewModel is the sole owner; tier views receive the
 * returned bag as a plain prop. Accepts a nullable `group` so the ViewModel
 * can call this hook unconditionally — when `group` is `null` the derivation
 * helpers short-circuit to empty results (no consumer reads them in that
 * state because the parent view switches to the list pane).
 */
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

  const filters = useGroupPermissionFilters({
    group: group ?? EMPTY_GROUP,
    permissions,
    searchQuery,
    selectedCategory,
  });

  const mutationActions = useGroupMutationActions({
    group: group ?? EMPTY_GROUP,
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

// Sentinel empty group used to short-circuit derivation hooks when no group is
// active — keeps the call unconditional (rules-of-hooks).
const EMPTY_GROUP: PermissionGroup = {
  id: "",
  slug: "",
  name: {},
  description: {},
  permissionIds: [],
  assignedUsers: [],
  isSystem: false,
  createdAt: null,
  updatedAt: null,
};

// NEW FOR PLAN v5: inferred return-type alias for ViewModel consumption
export type SingleGroupState = ReturnType<typeof useSingleGroupState>;
