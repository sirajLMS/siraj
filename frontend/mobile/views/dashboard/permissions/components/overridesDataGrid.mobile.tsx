"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  StyledBaselineTextShared,
  StyledPermissionDescriptionShared,
  StyledPermissionKeyTextShared,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesDataGridShared.styles";
import { resolveOverrideRow } from "@/frontend/common/views/dashboard/permissions/components/__shared__/resolveOverrideRow";
import type { OverridesDataGridProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { OverrideEditControlsMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overrideEditControls.mobile";
import { OverrideEffectiveDisplayMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overrideEffectiveDisplay.mobile";
import { useAppLocale } from "@/shared/locale";

export function OverridesDataGridMobile({
  labels,
  filteredPermissions,
  userGroups,
  localOverrides,
  mode,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverridesDataGridProps>) {
  const t = labels;
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
          const { isAllowedByGroup, baselineText, effectiveState, overrideState } = resolveOverrideRow(
            permission,
            userGroups,
            localOverrides,
            t,
            locale
          );

          let overrideControls: ReactNode = null;
          if (permission.id) {
            overrideControls =
              mode === "effective" ? (
                <OverrideEffectiveDisplayMobile
                  labels={labels}
                  effectiveState={effectiveState}
                  overrideState={overrideState}
                />
              ) : (
                <OverrideEditControlsMobile
                  labels={labels}
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
                  <StyledPermissionKeyTextShared variant="bodyMd">{permission.key}</StyledPermissionKeyTextShared>
                  {permission.description && (
                    <StyledPermissionDescriptionShared variant="caption">
                      {permission.description}
                    </StyledPermissionDescriptionShared>
                  )}
                </Box>

                <Box>
                  <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary, mb: 0.5 })}>
                    {t.columnGroupBaseline}
                  </Typography>
                  <StyledBaselineTextShared variant="bodyMd" isAllowed={isAllowedByGroup}>
                    {baselineText}
                  </StyledBaselineTextShared>
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
