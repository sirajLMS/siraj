"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { OverridesToolbarProps } from "@/frontend/common/views/dashboard/permissions/types";
import { useAppTranslation } from "@/shared/locale";

const StyledToolbarContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "stretch",
  gap: theme.spacing(1.5),
}));

const StyledModeToggleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(0.5),
  borderRadius: Number(theme.shape.borderRadius) * 2,
  backgroundColor: theme.palette.surfaceContainerHigh ?? theme.palette.action.hover,
  border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
}));

const StyledModeToggleButton = styled(Button, {
  shouldForwardProp: prop => prop !== "isActive",
})<{ isActive: boolean }>(({ theme, isActive }) => ({
  padding: `${theme.spacing(0.75)} ${theme.spacing(2)}`,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  fontWeight: isActive ? 600 : 500,
  backgroundColor: isActive ? theme.palette.primaryContainer : "transparent",
  color: isActive ? theme.palette.onPrimaryContainer : theme.palette.text.secondary,
  "&:hover": {
    backgroundColor: isActive ? theme.palette.primaryContainer : "transparent",
  },
}));

export function OverridesToolbarMobile({
  mode,
  onModeChange,
  searchQuery,
  onSearchChange,
}: Readonly<OverridesToolbarProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  return (
    <StyledToolbarContainer>
      <StyledModeToggleContainer>
        <StyledModeToggleButton
          variant="text"
          size="small"
          isActive={mode === "effective"}
          onClick={() => onModeChange("effective")}
        >
          {t.effectivePermissions}
        </StyledModeToggleButton>
        <StyledModeToggleButton
          variant="text"
          size="small"
          isActive={mode === "edit"}
          onClick={() => onModeChange("edit")}
        >
          {t.editOverrides}
        </StyledModeToggleButton>
      </StyledModeToggleContainer>

      <TextField
        size="small"
        placeholder={t.filterPermissions}
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ width: "100%" }}
      />
    </StyledToolbarContainer>
  );
}
