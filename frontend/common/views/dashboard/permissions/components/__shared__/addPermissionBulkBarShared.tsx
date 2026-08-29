"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { AddPermissionBulkBarSharedProps } from "@/frontend/common/views/dashboard/permissions/types/addPermissionBulkBarShared.types";
import { SharedDialogAssignButton } from "./sharedDialogButtons";

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

export function AddPermissionBulkBarShared({
  selectedCount,
  onAssignPermissions,
  t,
  variant,
}: Readonly<AddPermissionBulkBarSharedProps>) {
  return (
    <StyledBulkBarContainer tierVariant={variant}>
      <StyledSelectionLabel variant="titleLg">{t.itemsSelectedLabel(selectedCount)}</StyledSelectionLabel>
      <SharedDialogAssignButton
        label={t.assignPermissionsButton}
        onClick={onAssignPermissions}
        sx={{ textTransform: "none", ...(variant === "mobile" ? { width: "100%" } : {}) }}
      />
    </StyledBulkBarContainer>
  );
}
