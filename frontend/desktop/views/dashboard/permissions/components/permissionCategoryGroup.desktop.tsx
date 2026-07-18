"use client";

import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { labelSx } from "@/frontend/common/components/ui/form";
import type { PermissionCategoryGroupProps } from "@/frontend/common/views/dashboard/permissions/types";
import { PermissionRowDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionRow.desktop";

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
}: Readonly<PermissionCategoryGroupProps>) {
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
