"use client";

import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { labelSx } from "@/frontend/components/ui/form";
import type { Permission } from "@/frontend/graphql/generated/gql/graphql-types";
import { PermissionRow } from "./PermissionRow";

type ValidPermission = Permission & { id: string; key: string; category: string };

interface PermissionCategoryGroupProps {
  readonly categoryName: string;
  readonly perms: ValidPermission[];
  readonly selectedPermissionIds: readonly string[];
  readonly allChecked: boolean;
  readonly indeterminate: boolean;
  readonly onSelectAllCategory: (categoryPerms: Array<Permission & { id: string }>, checked: boolean) => void;
  readonly onTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly isLoading: boolean;
  readonly t: (key: string, params?: Record<string, string | number | Date>) => string;
}

export function PermissionCategoryGroup({
  categoryName,
  perms,
  selectedPermissionIds,
  allChecked,
  indeterminate,
  onSelectAllCategory,
  onTogglePermission,
  isLoading,
  t,
}: Readonly<PermissionCategoryGroupProps>) {
  return (
    <Box
      sx={theme => ({
        border: `1px solid ${theme.palette.outlineVariant}`,
        borderRadius: 2,
        overflow: "hidden",
      })}
    >
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          bgcolor: theme.palette.surfaceContainerHigh,
          borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
          {categoryName}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={allChecked}
              indeterminate={indeterminate}
              onChange={e => onSelectAllCategory(perms, e.target.checked)}
              disabled={isLoading}
            />
          }
          label={
            <Typography sx={labelSx} component="span">
              {t("allCategoriesOption")}
            </Typography>
          }
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {perms.map(perm => (
          <PermissionRow
            key={perm.id}
            perm={perm}
            isChecked={selectedPermissionIds.includes(perm.id)}
            onTogglePermission={onTogglePermission}
            isLoading={isLoading}
            t={t}
          />
        ))}
      </Box>
    </Box>
  );
}
