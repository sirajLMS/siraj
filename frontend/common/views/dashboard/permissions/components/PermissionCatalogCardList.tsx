"use client";

import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppTranslation } from "@/shared/locale/client";

export interface PermissionCatalogCardListProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
}

export function PermissionCatalogCardList({ permissions, groups }: Readonly<PermissionCatalogCardListProps>) {
  const t = useAppTranslation("dashboard.permissions");

  if (permissions.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t.noPermissionsFound}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {permissions.map(permission => {
        const key = permission.id ?? permission.key ?? "";
        const usedGroups = groups.filter(g => {
          const ids = g.permissionIds ?? [];
          return (permission.id && ids.includes(permission.id)) || (permission.key && ids.includes(permission.key));
        });

        return (
          <BaseCard key={key} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {/* Header: Key & Category */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                <Box
                  sx={theme => ({
                    fontFamily: "JetBrains Mono, monospace",
                    typography: "bodyMd",
                    fontWeight: 500,
                    backgroundColor: theme.palette.primaryContainer,
                    color: theme.palette.onPrimaryContainer,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    display: "inline-block",
                  })}
                >
                  {permission.key}
                </Box>
                {permission.category && (
                  <Typography
                    variant="labelMd"
                    sx={theme => ({
                      fontWeight: 500,
                      backgroundColor: theme.palette.surfaceVariant,
                      color: theme.palette.onSurfaceVariant,
                      border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      display: "inline-block",
                    })}
                  >
                    {permission.category}
                  </Typography>
                )}
              </Box>

              {/* Description */}
              {permission.description && (
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {permission.description}
                </Typography>
              )}

              {/* Used In Section */}
              {usedGroups.length > 0 && (
                <Box
                  sx={theme => ({
                    pt: 1.5,
                    borderTop: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
                  })}
                >
                  <Typography
                    variant="labelUppercase"
                    sx={theme => ({
                      display: "block",
                      color: theme.palette.text.secondary,
                      mb: 1,
                    })}
                  >
                    {t.columnUsedIn}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {usedGroups.map(g => {
                      if (!g.id || !g.name) return null;
                      return (
                        <LocalizedStringDisplay
                          key={g.id}
                          value={g.name}
                          typographyVariant="labelMd"
                          sx={theme => ({
                            fontWeight: 500,
                            backgroundColor: theme.palette.secondaryContainer,
                            color: theme.palette.onSecondaryContainer,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
                            display: "inline-block",
                          })}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          </BaseCard>
        );
      })}
    </Box>
  );
}
