"use client";

import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { PermissionsLabels } from "@/shared/locale";

const StyledBulkBarContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "stretch",
  gap: theme.spacing(1.5),
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
  width: "100%",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

interface AddPermissionBulkBarMobileProps {
  readonly selectedCount: number;
  readonly onAssignPermissions: () => void;
  readonly t: PermissionsLabels;
}

export function AddPermissionBulkBarMobile({
  selectedCount,
  onAssignPermissions,
  t,
}: Readonly<AddPermissionBulkBarMobileProps>) {
  return (
    <StyledBulkBarContainer>
      <StyledSelectionLabel variant="titleLg">{t.itemsSelectedLabel(selectedCount)}</StyledSelectionLabel>
      <StyledAssignButton variant="contained" onClick={onAssignPermissions}>
        {t.assignPermissionsButton}
      </StyledAssignButton>
    </StyledBulkBarContainer>
  );
}
