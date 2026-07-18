"use client";

import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { AddPermissionBulkBarProps } from "@/frontend/common/views/dashboard/permissions/types";

const StyledBulkBarContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: theme.palette.shadow.card,
}));

const StyledSelectionLabel = styled(Typography)({
  fontWeight: 600,
});

const StyledAssignButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  textTransform: "none",
  fontWeight: 700,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export function AddPermissionBulkBarDesktop({
  selectedCount,
  onAssignPermissions,
  t,
}: Readonly<AddPermissionBulkBarProps>) {
  return (
    <StyledBulkBarContainer>
      <StyledSelectionLabel variant="titleLg">{t.itemsSelectedLabel(selectedCount)}</StyledSelectionLabel>
      <StyledAssignButton variant="contained" onClick={onAssignPermissions}>
        {t.assignPermissionsButton}
      </StyledAssignButton>
    </StyledBulkBarContainer>
  );
}
