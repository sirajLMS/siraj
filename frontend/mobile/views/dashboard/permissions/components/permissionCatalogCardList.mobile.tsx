"use client";

import { Box, Typography } from "@mui/material";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { PermissionGroupChipShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupChipShared";
import { PermissionKeyChipShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionKeyChipShared";
import type { BasePermissionCatalogListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export function PermissionCatalogCardListMobile({
  labels,
  permissions,
  groups,
}: Readonly<BasePermissionCatalogListProps>) {
  const t = labels;
  const locale = useAppLocale();

  return (
    <MobileCardList
      rows={permissions}
      getKey={permission => permission.id ?? permission.key ?? ""}
      emptyMessage={t.noPermissionsFound}
      paginationOptions={{ mode: "client" }}
      renderItem={permission => {
        const usedGroups = groups.filter(g => {
          const ids = g.permissionIds ?? [];
          return (permission.id && ids.includes(permission.id)) ?? (permission.key && ids.includes(permission.key));
        });

        return (
          <MobileCardListItem variant="edge-to-edge">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                <PermissionKeyChipShared label={permission.key ?? ""} />
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
                      const label = resolveLocalizedString(g.name, locale);
                      if (!label) return null;
                      return <PermissionGroupChipShared key={g.id} label={label} />;
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
