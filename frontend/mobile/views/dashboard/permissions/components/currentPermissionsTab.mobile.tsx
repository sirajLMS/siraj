"use client";

import { RemoveCircleOutlined, SecurityOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppTranslation } from "@/shared/locale";

const StyledRevokeButton = styled(Button)(({ theme }) => ({
  color: theme.palette.error.main,
  fontWeight: 600,
  typography: "labelMd",
}));

const StyledEmptyStateContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
  textAlign: "center",
  gap: theme.spacing(2),
}));

const StyledEmptyStateIconCircle = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  borderRadius: "50%",
  backgroundColor: theme.palette.surfaceContainerHigh ?? theme.palette.action.hover,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledEmptyStateTitle = styled(Typography)({
  fontWeight: 600,
});

const StyledEmptyStateDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  maxWidth: 400,
}));

const StyledAssignFirstButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  textTransform: "none",
  fontWeight: 600,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const StyledPermissionKeyChip = styled(Box)(({ theme }) => ({
  fontFamily: "JetBrains Mono, monospace",
  typography: "labelMd",
  backgroundColor: theme.palette.surfaceVariant,
  color: theme.palette.onSurfaceVariant,
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  borderRadius: theme.shape.borderRadius,
  display: "inline-block",
}));

interface CurrentPermissionsTabMobileProps {
  readonly group: PermissionGroup;
  readonly groupPermissions: readonly Permission[];
  readonly permissionsCount: number;
  readonly onRevokePermission: (permissionId: string) => Promise<void>;
  readonly onSwitchToAddTab: () => void;
  readonly loading?: boolean;
}

export function CurrentPermissionsTabMobile({
  group,
  groupPermissions,
  permissionsCount,
  onRevokePermission,
  onSwitchToAddTab,
  loading = false,
}: Readonly<CurrentPermissionsTabMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  if (permissionsCount === 0 && !loading) {
    return (
      <StyledEmptyStateContainer>
        <StyledEmptyStateIconCircle>
          <SecurityOutlined fontSize="large" sx={theme => ({ color: theme.palette.text.secondary })} />
        </StyledEmptyStateIconCircle>
        <StyledEmptyStateTitle variant="titleLg">{t.noPermissionsAssignedYet}</StyledEmptyStateTitle>
        <StyledEmptyStateDescription variant="bodyMd">{t.noPermissionsDescription}</StyledEmptyStateDescription>
        {!group.isSystem && (
          <StyledAssignFirstButton variant="contained" onClick={onSwitchToAddTab}>
            {t.assignFirstPermission}
          </StyledAssignFirstButton>
        )}
      </StyledEmptyStateContainer>
    );
  }

  if (groupPermissions.length === 0 && !loading) {
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
      {groupPermissions.map(permission => {
        const key = permission.id ?? permission.key ?? "";
        return (
          <BaseCard key={key} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                <StyledPermissionKeyChip>{permission.key}</StyledPermissionKeyChip>
                {permission.category && (
                  <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                    {permission.category}
                  </Typography>
                )}
              </Box>
              {permission.description && (
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {permission.description}
                </Typography>
              )}
              {!group.isSystem && permission.id && (
                <StyledRevokeButton
                  size="small"
                  startIcon={<RemoveCircleOutlined fontSize="small" />}
                  onClick={() => permission.id && onRevokePermission(permission.id)}
                >
                  {t.revoke}
                </StyledRevokeButton>
              )}
            </Box>
          </BaseCard>
        );
      })}
    </Box>
  );
}
