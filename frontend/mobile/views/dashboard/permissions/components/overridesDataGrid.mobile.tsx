"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { OverrideEditControlsMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overrideEditControls.mobile";
import { OverrideEffectiveDisplayMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overrideEffectiveDisplay.mobile";
import { useAppTranslation } from "@/shared/locale";

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

interface OverridesDataGridMobileProps {
  readonly filteredPermissions: readonly Permission[];
  readonly userGroups: readonly PermissionGroup[];
  readonly localOverrides: Record<string, OverrideState>;
  readonly mode: "effective" | "edit";
  readonly isDialogLoading: boolean;
  readonly handleOverrideChange: (permissionId: string, state: OverrideState) => void;
}

export function OverridesDataGridMobile({
  filteredPermissions,
  userGroups,
  localOverrides,
  mode,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverridesDataGridMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  if (filteredPermissions.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t.noPermissionsFound}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}>
      {filteredPermissions.map(permission => {
        const key = permission.id ?? permission.key ?? "";
        const baselineGroups = userGroups.filter(
          g =>
            (permission.id && g.permissionIds?.includes(permission.id)) ||
            (permission.key && g.permissionIds?.includes(permission.key))
        );
        const isAllowedByGroup = baselineGroups.length > 0;
        const baselineText = isAllowedByGroup
          ? t.allowedViaGroups(baselineGroups.map(g => g.name).join(", "))
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

        return (
          <MobileBaseCard key={key} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box>
                <StyledPermissionKeyText variant="bodyMd">{permission.key}</StyledPermissionKeyText>
                {permission.description && (
                  <StyledPermissionDescription variant="caption">{permission.description}</StyledPermissionDescription>
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
                {permission.id ? (
                  mode === "effective" ? (
                    <OverrideEffectiveDisplayMobile effectiveState={effectiveState} overrideState={overrideState} />
                  ) : (
                    <OverrideEditControlsMobile
                      permissionId={permission.id}
                      overrideState={overrideState}
                      isDialogLoading={isDialogLoading}
                      handleOverrideChange={handleOverrideChange}
                    />
                  )
                ) : null}
              </Box>
            </Box>
          </MobileBaseCard>
        );
      })}
    </Box>
  );
}
