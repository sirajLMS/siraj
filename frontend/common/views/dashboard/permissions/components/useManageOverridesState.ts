import { useState } from "react";
import type { Permission, PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";
import { useOverrideData } from "@/frontend/common/views/dashboard/permissions/components/useOverrideData";

interface UseManageOverridesStateParams {
  readonly userId: string | null;
  readonly users: readonly User[];
  readonly groups: readonly PermissionGroup[];
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSave: (userId: string, overrides: Array<{ permissionId: string; state: string }>) => Promise<void>;
}

export function useManageOverridesState({
  userId,
  users,
  groups,
  permissions,
  isLoading,
  open,
  onClose,
  onSave,
}: UseManageOverridesStateParams) {
  const [mode, setMode] = useState<"effective" | "edit">("edit");
  const [searchQuery, setSearchQuery] = useState("");
  const [localOverrides, setLocalOverrides] = useState<Record<string, OverrideState>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { user, userGroups, filteredPermissions, queryLoading, initialOverrides } = useOverrideData({
    userId,
    users,
    groups,
    permissions,
    open,
    searchQuery,
  });

  const [prevInitialOverrides, setPrevInitialOverrides] = useState(initialOverrides);

  if (initialOverrides !== prevInitialOverrides) {
    setPrevInitialOverrides(initialOverrides);
    setLocalOverrides(initialOverrides);
  }

  const handleOverrideChange = (permissionId: string, state: OverrideState) => {
    setLocalOverrides(prev => ({
      ...prev,
      [permissionId]: state,
    }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const formattedOverrides = Object.entries(localOverrides)
        .filter(([_, state]) => state !== "INHERIT")
        .map(([permissionId, state]) => ({
          permissionId,
          state,
        }));
      await onSave(userId, formattedOverrides);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const isDialogLoading = queryLoading || isLoading || isSaving;

  return {
    user,
    userGroups,
    filteredPermissions,
    localOverrides,
    mode,
    searchQuery,
    isDialogLoading,
    isSaving,
    handleOverrideChange,
    handleSave,
    setMode,
    setSearchQuery,
  };
}

// NEW FOR PLAN v5: inferred return-type alias for ViewModel consumption
export type ManageOverridesState = ReturnType<typeof useManageOverridesState>;
