"use client";

import { Box, Button, Typography } from "@mui/material";

interface AddPermissionBulkBarProps {
  readonly selectedCount: number;
  readonly onAssignPermissions: () => void;
  readonly t: (key: string, params?: Record<string, string | number | Date>) => string;
}

export function AddPermissionBulkBar({ selectedCount, onAssignPermissions, t }: Readonly<AddPermissionBulkBarProps>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 1.5,
        bgcolor: theme.palette.primaryContainer,
        color: theme.palette.onPrimaryContainer,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: 2,
      })}
    >
      <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
        {t("itemsSelectedLabel", { count: selectedCount })}
      </Typography>
      <Button
        variant="contained"
        onClick={onAssignPermissions}
        sx={theme => ({
          bgcolor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 1.5,
          "&:hover": {
            bgcolor: theme.palette.primary.dark,
          },
        })}
      >
        {t("assignPermissionsButton")}
      </Button>
    </Box>
  );
}
