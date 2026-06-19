"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import { useTranslations } from "next-intl";

interface OverridesToolbarProps {
  readonly mode: "effective" | "edit";
  readonly onModeChange: (mode: "effective" | "edit") => void;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
}

export function OverridesToolbar({ mode, onModeChange, searchQuery, onSearchChange }: Readonly<OverridesToolbarProps>) {
  const t = useTranslations("dashboard.permissions");

  return (
    <Box
      sx={theme => ({
        p: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      })}
    >
      <Box
        sx={theme => ({
          display: "flex",
          p: 0.5,
          borderRadius: 2,
          bgcolor: theme.palette.surfaceContainerHigh ?? theme.palette.action.hover,
          border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
        })}
      >
        <Button
          variant="text"
          size="small"
          onClick={() => onModeChange("effective")}
          sx={theme => ({
            px: 2,
            py: 0.75,
            borderRadius: 1.5,
            fontWeight: mode === "effective" ? 600 : 500,
            bgcolor: mode === "effective" ? theme.palette.primaryContainer : "transparent",
            color: mode === "effective" ? theme.palette.onPrimaryContainer : theme.palette.text.secondary,
            "&:hover": {
              bgcolor: mode === "effective" ? theme.palette.primaryContainer : "transparent",
            },
          })}
        >
          {t("effectivePermissions")}
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() => onModeChange("edit")}
          sx={theme => ({
            px: 2,
            py: 0.75,
            borderRadius: 1.5,
            fontWeight: mode === "edit" ? 600 : 500,
            bgcolor: mode === "edit" ? theme.palette.primaryContainer : "transparent",
            color: mode === "edit" ? theme.palette.onPrimaryContainer : theme.palette.text.secondary,
            "&:hover": {
              bgcolor: mode === "edit" ? theme.palette.primaryContainer : "transparent",
            },
          })}
        >
          Edit Overrides
        </Button>
      </Box>

      <TextField
        size="small"
        placeholder="Filter permissions..."
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
    </Box>
  );
}
