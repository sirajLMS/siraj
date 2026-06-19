"use client";

import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/components/ui";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";

export interface PermissionCatalogCardListProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
}

export function PermissionCatalogCardList({ permissions, groups }: Readonly<PermissionCatalogCardListProps>) {
  const t = useTranslations("dashboard.permissions");

  if (permissions.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t("noPermissionsFound")}
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
                    fontSize: "0.8125rem",
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
                  <Box
                    sx={theme => ({
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      backgroundColor: theme.palette.surfaceVariant,
                      color: theme.palette.onSurfaceVariant,
                      border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    })}
                  >
                    {permission.category}
                  </Box>
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
                      fontSize: "0.6875rem",
                      color: theme.palette.text.secondary,
                      mb: 1,
                    })}
                  >
                    {t("columnUsedIn")}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {usedGroups.map(g => {
                      if (!g.id || !g.name) return null;
                      return (
                        <Box
                          key={g.id}
                          sx={theme => ({
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            backgroundColor: theme.palette.secondaryContainer,
                            color: theme.palette.onSecondaryContainer,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
                          })}
                        >
                          {g.name}
                        </Box>
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
