"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";
import type { OverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { OverrideEditControlsMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overrideEditControls.mobile";
import { OverrideEffectiveDisplayMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overrideEffectiveDisplay.mobile";
import { useAppLocale, useAppTranslation } from "@/shared/locale";

const StyledPermissionKeyText = styled(Typography)(({ theme }) => ({
  fontFamily: "JetBrains Mono, monospace",
  fontSize: theme.typography.labelMd.fontSize,
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

const StyledPermissionDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

const StyledBaselineText = styled(Typography, {
  shouldForwardProp: prop => prop !== "isAllowed",
})<{ isAllowed: boolean }>(({ theme, isAllowed }) => ({
  color: isAllowed ? theme.palette.success.main : theme.palette.text.secondary,
}));

export function OverridesDataGridMobile({
  filteredPermissions,
  userGroups,
  localOverrides,
  mode,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverridesDataGridProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;
  const locale = useAppLocale();

  return (
    <Box sx={{ p: 2 }}>
      <MobileCardList
        rows={filteredPermissions}
        emptyMessage={t.noPermissionsFound}
        getKey={permission => permission.id ?? permission.key ?? ""}
        paginationOptions={{ mode: "client" }}
        layout="edge-to-edge"
        renderItem={permission => {
          const baselineGroups = userGroups.filter(
            g =>
              (permission.id && g.permissionIds?.includes(permission.id)) ||
              (permission.key && g.permissionIds?.includes(permission.key))
          );
          const isAllowedByGroup = baselineGroups.length > 0;
          const baselineText = isAllowedByGroup
            ? t.allowedViaGroups(
                baselineGroups.map(g => resolveLocalizedString(g.name, locale) || g.slug || "").join(", ")
              )
            : t.notSet;
          const overrideState: OverrideState = (permission.id && localOverrides[permission.id]) || "INHERIT";

          let effectiveState: "allowed" | "denied" | "not_set";
          if (overrideState === "GRANTED") {
            effectiveState = "allowed";
          } else if (overrideState === "DENIED") {
            effectiveState = "denied";
          } else if (isAllowedByGroup) {
            effectiveState = "allowed";
          } else {
            effectiveState = "not_set";
          }

          let overrideControls: ReactNode = null;
          if (permission.id) {
            overrideControls =
              mode === "effective" ? (
                <OverrideEffectiveDisplayMobile effectiveState={effectiveState} overrideState={overrideState} />
              ) : (
                <OverrideEditControlsMobile
                  permissionId={permission.id}
                  overrideState={overrideState}
                  isDialogLoading={isDialogLoading}
                  handleOverrideChange={handleOverrideChange}
                />
              );
          }

          return (
            <MobileCardListItem variant="edge-to-edge">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box>
                  <StyledPermissionKeyText variant="bodyMd">{permission.key}</StyledPermissionKeyText>
                  {permission.description && (
                    <StyledPermissionDescription variant="caption">
                      {permission.description}
                    </StyledPermissionDescription>
                  )}
                </Box>

                <Box>
                  <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary, mb: 0.5 })}>
                    {t.columnGroupBaseline}
                  </Typography>
                  <StyledBaselineText variant="bodyMd" isAllowed={isAllowedByGroup}>
                    {baselineText}
                  </StyledBaselineText>
                </Box>

                <Box>
                  <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary, mb: 0.5 })}>
                    {t.columnOverrideControl}
                  </Typography>
                  {overrideControls}
                </Box>
              </Box>
            </MobileCardListItem>
          );
        }}
      />
    </Box>
  );
}
