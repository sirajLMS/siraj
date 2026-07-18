"use client";

import { Button, ButtonGroup } from "@mui/material";
import { alpha, styled, type Theme } from "@mui/material/styles";
import type { OverrideEditControlsProps } from "@/frontend/common/views/dashboard/permissions/types";

type OverrideColorVariant = "inherit" | "allow" | "deny";

function getVariantColors(variant: OverrideColorVariant, theme: Theme) {
  if (variant === "inherit") {
    return { bg: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer };
  }
  if (variant === "allow") {
    return {
      bg: theme.palette.successContainer ?? alpha(theme.palette.success.main, 0.15),
      color: theme.palette.success.main,
    };
  }
  return { bg: theme.palette.errorContainer ?? alpha(theme.palette.error.main, 0.15), color: theme.palette.error.main };
}

const StyledOverrideButton = styled(Button, {
  shouldForwardProp: prop => prop !== "isActive" && prop !== "colorVariant",
})<{ isActive: boolean; colorVariant: OverrideColorVariant }>(({ theme, isActive, colorVariant }) => {
  const { bg: activeBg, color: activeColor } = getVariantColors(colorVariant, theme);

  return {
    fontSize: theme.typography.labelMd.fontSize,
    borderColor: theme.palette.divider,
    backgroundColor: isActive ? activeBg : "transparent",
    color: isActive ? activeColor : theme.palette.text.secondary,
    fontWeight: colorVariant !== "inherit" && isActive ? 600 : 400,
    "&:hover": {
      backgroundColor: isActive ? activeBg : "transparent",
      borderColor: theme.palette.divider,
    },
  };
});

export function OverrideEditControlsMobile({
  permissionId,
  overrideState,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverrideEditControlsProps>) {
  return (
    <ButtonGroup variant="outlined" size="small" fullWidth disabled={isDialogLoading}>
      <StyledOverrideButton
        colorVariant="inherit"
        isActive={overrideState === "INHERIT"}
        onClick={() => handleOverrideChange(permissionId, "INHERIT")}
      >
        Inherit
      </StyledOverrideButton>
      <StyledOverrideButton
        colorVariant="allow"
        isActive={overrideState === "GRANTED"}
        onClick={() => handleOverrideChange(permissionId, "GRANTED")}
      >
        Allow
      </StyledOverrideButton>
      <StyledOverrideButton
        colorVariant="deny"
        isActive={overrideState === "DENIED"}
        onClick={() => handleOverrideChange(permissionId, "DENIED")}
      >
        Deny
      </StyledOverrideButton>
    </ButtonGroup>
  );
}
