"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";

const StyledToolbarContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
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

interface OverridesToolbarProps {
  readonly mode: "effective" | "edit";
  readonly onModeChange: (mode: "effective" | "edit") => void;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
}

export function OverridesToolbar({ mode, onModeChange, searchQuery, onSearchChange }: Readonly<OverridesToolbarProps>) {
  const t = useTranslations("dashboard.permissions");

  return (
    <StyledToolbarContainer>
      {/* Mode Toggle */}
      <StyledModeToggleContainer>
        <StyledModeToggleButton
          variant="text"
          size="small"
          isActive={mode === "effective"}
          onClick={() => onModeChange("effective")}
        >
          {t("effectivePermissions")}
        </StyledModeToggleButton>
        <StyledModeToggleButton
          variant="text"
          size="small"
          isActive={mode === "edit"}
          onClick={() => onModeChange("edit")}
        >
          {t("editOverrides")}
        </StyledModeToggleButton>
      </StyledModeToggleContainer>

      {/* Search Box */}
      <TextField
        size="small"
        placeholder={t("filterPermissions")}
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
        sx={{ width: { xs: "100%", sm: 260 } }}
      />
    </StyledToolbarContainer>
  );
}
