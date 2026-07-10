"use client";

import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Permission } from "@/frontend/graphql/generated/gql/graphql-types";
import { PermissionCategoryGroup } from "@/frontend/views/dashboard/permissions/components/PermissionCategoryGroup";

type ValidPermission = Permission & { id: string; key: string; category: string };

interface PermissionCategoryListProps {
  readonly groupedPermissions: Record<string, ValidPermission[]>;
  readonly selectedPermissionIds: readonly string[];
  readonly isGroupSelected: (categoryPerms: Array<Permission & { id: string }>) => boolean;
  readonly isGroupIndeterminate: (categoryPerms: Array<Permission & { id: string }>) => boolean;
  readonly onSelectAllCategory: (categoryPerms: Array<Permission & { id: string }>, checked: boolean) => void;
  readonly onTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly isLoading: boolean;
}

export function PermissionCategoryList({
  groupedPermissions,
  selectedPermissionIds,
  isGroupSelected,
  isGroupIndeterminate,
  onSelectAllCategory,
  onTogglePermission,
  isLoading,
}: Readonly<PermissionCategoryListProps>) {
  const t = useTranslations("dashboard.permissions");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {Object.keys(groupedPermissions).length === 0 ? (
        <Typography
          variant="bodyMd"
          sx={theme => ({ textAlign: "center", color: theme.palette.text.secondary, py: 4 })}
        >
          {t("noPermissionsFound")}
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
