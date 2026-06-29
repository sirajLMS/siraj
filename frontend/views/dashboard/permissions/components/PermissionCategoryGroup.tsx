"use client";

import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { labelSx } from "@/frontend/components/ui/form";
import type { Permission } from "@/frontend/graphql/generated/gql/graphql-types";
import { PermissionRow } from "./PermissionRow";

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
    <StyledCategoryContainer>
      {/* Category Header with Select All */}
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
              {t("allCategoriesOption")}
            </Box>
          }
        />
      </StyledCategoryHeader>

      {/* Permission Items */}
      <StyledPermissionList>
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
      </StyledPermissionList>
    </StyledCategoryContainer>
  );
}
