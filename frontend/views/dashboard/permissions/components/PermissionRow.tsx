"use client";

import { Lock } from "@mui/icons-material";
import { Box, Checkbox, Tooltip, Typography } from "@mui/material";
import type { Permission } from "@/frontend/graphql/generated/gql/graphql-types";

type ValidPermission = Permission & { id: string; key: string; category: string };

interface PermissionRowProps {
  readonly perm: ValidPermission;
  readonly isChecked: boolean;
  readonly onTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly isLoading: boolean;
  readonly t: (key: string, params?: Record<string, string | number | Date>) => string;
}

export function PermissionRow({ perm, isChecked, onTogglePermission, isLoading, t }: Readonly<PermissionRowProps>) {
  return (
    <Box
      onClick={() => onTogglePermission(perm.id, !!perm.isSystem)}
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 1.5,
        cursor: perm.isSystem ? "not-allowed" : "pointer",
        bgcolor: isChecked ? theme.palette.primaryContainer : "transparent",
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        "&:last-child": {
          borderBottom: "none",
        },
        "&:hover": {
          bgcolor: isChecked ? theme.palette.primaryContainer : theme.palette.action.hover,
        },
        opacity: perm.isSystem ? 0.7 : 1,
        transition: "background-color 0.2s",
      })}
    >
      <Checkbox
        checked={isChecked}
        disabled={!!perm.isSystem || isLoading}
        onClick={e => e.stopPropagation()}
        onChange={() => onTogglePermission(perm.id, !!perm.isSystem)}
      />

      <Box sx={{ flex: 1, ml: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="bodyMd"
            sx={theme => ({
              fontFamily: "monospace",
              fontWeight: 600,
              color: isChecked ? theme.palette.onPrimaryContainer : theme.palette.primary.main,
            })}
          >
            {perm.key}
          </Typography>
          {perm.isSystem && (
            <Tooltip title={t("corePermissionTooltip")}>
              <Lock fontSize="small" color="error" />
            </Tooltip>
          )}
        </Box>
        {perm.description && (
          <Typography
            variant="caption"
            sx={theme => ({
              color: isChecked ? theme.palette.onPrimaryContainer : theme.palette.text.secondary,
              mt: 0.5,
            })}
          >
            {perm.description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
