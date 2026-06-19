"use client";

import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledBulkBarContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: theme.shadows[2],
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

interface AddPermissionBulkBarProps {
  readonly selectedCount: number;
  readonly onAssignPermissions: () => void;
  readonly t: (key: string, params?: Record<string, string | number | Date>) => string;
}

export function AddPermissionBulkBar({ selectedCount, onAssignPermissions, t }: Readonly<AddPermissionBulkBarProps>) {
  return (
    <StyledBulkBarContainer>
      {/* Selection Count */}
      <StyledSelectionLabel variant="titleLg">{t("itemsSelectedLabel", { count: selectedCount })}</StyledSelectionLabel>
      {/* Assign Action */}
      <StyledAssignButton variant="contained" onClick={onAssignPermissions}>
        {t("assignPermissionsButton")}
      </StyledAssignButton>
    </StyledBulkBarContainer>
  );
}
