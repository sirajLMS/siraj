"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { OverridesToolbarProps } from "@/frontend/common/views/dashboard/permissions/types";

export interface OverridesToolbarSharedOptions {
  readonly toolbarContainerSx: object;
  readonly textFieldSx: object;
}

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

export function OverridesToolbarShared({
  labels,
  mode,
  onModeChange,
  searchQuery,
  onSearchChange,
  options,
}: Readonly<OverridesToolbarProps> & { readonly options: OverridesToolbarSharedOptions }) {
  const t = labels;

  return (
    <Box sx={options.toolbarContainerSx}>
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
        sx={options.textFieldSx}
      />
    </Box>
  );
}
