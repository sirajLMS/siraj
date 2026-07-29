"use client";

import { Box, Typography } from "@mui/material";
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { BasePermissionCatalogListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobileLocalizedStringDisplay } from "@/frontend/mobile/components/ui/display/localizedStringDisplay";

export function PermissionCatalogCardListMobile({
  labels,
  permissions,
  groups,
}: Readonly<BasePermissionCatalogListProps>) {
  const t = labels;

  return (
    <MobileCardList<Permission>
      rows={permissions}
      getKey={permission => permission.id ?? permission.key ?? ""}
      emptyMessage={t.noPermissionsFound}
      paginationOptions={{ mode: "client" }}
      renderItem={permission => {
        const usedGroups = groups.filter(g => {
          const ids = g.permissionIds ?? [];
          return (permission.id && ids.includes(permission.id)) || (permission.key && ids.includes(permission.key));
        });

        return (
          <MobileCardListItem variant="edge-to-edge">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                <Box
                  sx={theme => ({
                    fontFamily: "var(--font-jetbrains-mono), monospace",
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

              {permission.description && (
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {permission.description}
                </Typography>
              )}

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
                        <MobileLocalizedStringDisplay
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
          </MobileCardListItem>
        );
      }}
    />
  );
}
