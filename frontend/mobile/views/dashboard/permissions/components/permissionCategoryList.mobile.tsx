"use client";

import { Box, Typography } from "@mui/material";
import type { PermissionCategoryListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { PermissionCategoryGroupMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCategoryGroup.mobile";
export function PermissionCategoryListMobile({
  groupedPermissions,
  selectedPermissionIds,
  isGroupSelected,
  isGroupIndeterminate,
  onSelectAllCategory,
  onTogglePermission,
  isLoading,
  t,
}: Readonly<PermissionCategoryListProps>) {
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
          <PermissionCategoryGroupMobile
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
