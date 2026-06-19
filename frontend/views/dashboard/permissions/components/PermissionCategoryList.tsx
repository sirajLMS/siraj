"use client";

import { Lock } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, Tooltip, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { labelSx } from "@/frontend/components/ui/form";
import type { Permission } from "@/frontend/graphql/generated/gql/graphql-types";

type ValidPermission = Permission & { id: string; key: string; category: string };

interface PermissionCategoryListProps {
  readonly groupedPermissions: Record<string, ValidPermission[]>;
  readonly selectedPermissionIds: readonly string[];
  readonly isGroupSelected: (categoryPerms: Array<Permission & { id: string }>) => boolean;
  readonly isGroupIndeterminate: (categoryPerms: Array<Permission & { id: string }>) => boolean;
  readonly onSelectAllCategory: (categoryPerms: Array<Permission & { id: string }>, checked: boolean) => void;
  readonly onTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly isLoading: boolean;
}

export function PermissionCategoryList({
  groupedPermissions,
  selectedPermissionIds,
  isGroupSelected,
  isGroupIndeterminate,
  onSelectAllCategory,
  onTogglePermission,
  isLoading,
}: Readonly<PermissionCategoryListProps>) {
  const t = useTranslations("dashboard.permissions");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {Object.keys(groupedPermissions).length === 0 ? (
        <Typography
          variant="bodyMd"
          sx={theme => ({ textAlign: "center", color: theme.palette.text.secondary, py: 4 })}
        >
          {t("noPermissionsFound")}
        </Typography>
      ) : (
        Object.entries(groupedPermissions).map(([categoryName, perms]) => {
          const allChecked = isGroupSelected(perms);
          const indeterminate = isGroupIndeterminate(perms);

          return (
            <Box
              key={categoryName}
              sx={theme => ({
                border: `1px solid ${theme.palette.outlineVariant}`,
                borderRadius: 2,
                overflow: "hidden",
              })}
            >
              <Box
                sx={theme => ({
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.5,
                  bgcolor: theme.palette.surfaceContainerHigh,
                  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
                })}
              >
                <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
                  {categoryName}
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allChecked}
                      indeterminate={indeterminate}
                      onChange={e => onSelectAllCategory(perms, e.target.checked)}
                      disabled={isLoading}
                    />
                  }
                  label={
                    <Typography sx={labelSx} component="span">
                      {t("allCategoriesOption")}
                    </Typography>
                  }
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {perms.map(perm => {
                  const isChecked = selectedPermissionIds.includes(perm.id);

                  return (
                    <Box
                      key={perm.id}
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
                })}
              </Box>
            </Box>
          );
        })
      )}
    </Box>
  );
}
