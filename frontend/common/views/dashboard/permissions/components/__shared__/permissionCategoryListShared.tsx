"use client";

import { Box, Typography } from "@mui/material";
import type { ComponentType } from "react";
import type {
  PermissionCategoryGroupProps,
  PermissionCategoryListProps,
} from "@/frontend/common/views/dashboard/permissions/types";

export interface PermissionCategoryListSharedSlots {
  readonly PermissionCategoryGroup: ComponentType<Readonly<PermissionCategoryGroupProps>>;
}

export function PermissionCategoryListShared({
  groupedPermissions,
  selectedPermissionIds,
  isGroupSelected,
  isGroupIndeterminate,
  onSelectAllCategory,
  onTogglePermission,
  isLoading,
  t,
  slots,
}: Readonly<PermissionCategoryListProps> & { readonly slots: PermissionCategoryListSharedSlots }) {
  const { PermissionCategoryGroup } = slots;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {Object.keys(groupedPermissions).length === 0 ? (
        <Typography
          variant="bodyMd"
          sx={theme => ({ textAlign: "center", color: theme.palette.text.secondary, py: 4 })}
        >
          {t.noPermissionsFound}
        </Typography>
      ) : (
        Object.entries(groupedPermissions).map(([categoryName, perms]) => (
          <PermissionCategoryGroup
            key={categoryName}
            categoryName={categoryName}
            perms={perms}
            selectedPermissionIds={selectedPermissionIds}
            allChecked={isGroupSelected(perms)}
            indeterminate={isGroupIndeterminate(perms)}
            onSelectAllCategory={onSelectAllCategory}
            onTogglePermission={onTogglePermission}
            isLoading={isLoading}
            t={t}
          />
        ))
      )}
    </Box>
  );
}
