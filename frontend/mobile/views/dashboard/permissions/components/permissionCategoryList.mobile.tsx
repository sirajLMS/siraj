"use client";

import { Box, Typography } from "@mui/material";
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PermissionCategoryGroupMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCategoryGroup.mobile";
import type { PermissionsLabels } from "@/shared/locale";

type ValidPermission = Permission & { id: string; key: string; category: string };

interface PermissionCategoryListMobileProps {
  readonly groupedPermissions: Record<string, ValidPermission[]>;
  readonly selectedPermissionIds: readonly string[];
  readonly isGroupSelected: (categoryPerms: Array<Permission & { id: string }>) => boolean;
  readonly isGroupIndeterminate: (categoryPerms: Array<Permission & { id: string }>) => boolean;
  readonly onSelectAllCategory: (categoryPerms: Array<Permission & { id: string }>, checked: boolean) => void;
  readonly onTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly isLoading: boolean;
  readonly t: PermissionsLabels;
}

export function PermissionCategoryListMobile({
  groupedPermissions,
  selectedPermissionIds,
  isGroupSelected,
  isGroupIndeterminate,
  onSelectAllCategory,
  onTogglePermission,
  isLoading,
  t,
}: Readonly<PermissionCategoryListMobileProps>) {
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
