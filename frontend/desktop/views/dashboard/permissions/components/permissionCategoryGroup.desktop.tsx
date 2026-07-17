"use client";

import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { labelSx } from "@/frontend/common/components/ui/form";
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PermissionRowDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionRow.desktop";
import type { PermissionsLabels } from "@/shared/locale";

const StyledCategoryContainer = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.outlineVariant}`,
  borderRadius: Number(theme.shape.borderRadius) * 2,
  overflow: "hidden",
}));

const StyledCategoryHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
  backgroundColor: theme.palette.surfaceContainerHigh,
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
}));

const StyledPermissionList = styled(Box)({
  display: "flex",
  flexDirection: "column",
});

type ValidPermission = Permission & { id: string; key: string; category: string };

interface PermissionCategoryGroupDesktopProps {
  readonly categoryName: string;
  readonly perms: ValidPermission[];
  readonly selectedPermissionIds: readonly string[];
  readonly allChecked: boolean;
  readonly indeterminate: boolean;
  readonly onSelectAllCategory: (categoryPerms: Array<Permission & { id: string }>, checked: boolean) => void;
  readonly onTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly isLoading: boolean;
  readonly t: PermissionsLabels;
}

export function PermissionCategoryGroupDesktop({
  categoryName,
  perms,
  selectedPermissionIds,
  allChecked,
  indeterminate,
  onSelectAllCategory,
  onTogglePermission,
  isLoading,
  t,
}: Readonly<PermissionCategoryGroupDesktopProps>) {
  return (
    <StyledCategoryContainer>
      <StyledCategoryHeader>
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
            <Box component="span" sx={labelSx}>
              {t.allCategoriesOption}
            </Box>
          }
        />
      </StyledCategoryHeader>

      <StyledPermissionList>
        {perms.map(perm => (
          <PermissionRowDesktop
            key={perm.id}
            perm={perm}
            isChecked={selectedPermissionIds.includes(perm.id)}
            onTogglePermission={onTogglePermission}
            isLoading={isLoading}
            t={t}
          />
        ))}
      </StyledPermissionList>
    </StyledCategoryContainer>
  );
}
