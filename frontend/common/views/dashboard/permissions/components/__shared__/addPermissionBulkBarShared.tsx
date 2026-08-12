"use client";

import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { AddPermissionBulkBarSharedProps } from "@/frontend/common/views/dashboard/permissions/types/addPermissionBulkBarShared.types";

const StyledBulkBarContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "tierVariant",
})<{ readonly tierVariant: "desktop" | "mobile" }>(({ theme, tierVariant }) => ({
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  display: "flex",
  justifyContent: "space-between",
  boxShadow: theme.palette.shadow.card,
  ...(tierVariant === "desktop"
    ? {
        flexDirection: "row" as const,
        alignItems: "center" as const,
      }
    : {
        flexDirection: "column" as const,
        alignItems: "stretch" as const,
        gap: theme.spacing(1.5),
      }),
}));

const StyledSelectionLabel = styled(Typography)({
  fontWeight: 600,
});

const StyledAssignButton = styled(Button, {
  shouldForwardProp: prop => prop !== "tierVariant",
})<{ readonly tierVariant: "desktop" | "mobile" }>(({ theme, tierVariant }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  textTransform: "none",
  fontWeight: 700,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  ...(tierVariant === "mobile" ? { width: "100%" } : {}),
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export function AddPermissionBulkBarShared({
  selectedCount,
  onAssignPermissions,
  t,
  variant,
}: Readonly<AddPermissionBulkBarSharedProps>) {
  return (
    <StyledBulkBarContainer tierVariant={variant}>
      <StyledSelectionLabel variant="titleLg">{t.itemsSelectedLabel(selectedCount)}</StyledSelectionLabel>
      <StyledAssignButton variant="contained" tierVariant={variant} onClick={onAssignPermissions}>
        {t.assignPermissionsButton}
      </StyledAssignButton>
    </StyledBulkBarContainer>
  );
}
