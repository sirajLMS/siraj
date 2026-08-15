"use client";

import { RemoveCircleOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { CurrentPermissionsEmptyState } from "@/frontend/common/views/dashboard/permissions/components/__shared__/currentPermissionsTabShared";
import {
  StyledPermissionKeyChipShared,
  StyledRevokeButtonShared,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/currentPermissionsTabShared.styles";
import type { CurrentPermissionsTabProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";

export function CurrentPermissionsTabMobile({
  labels,
  groupPermissions,
  permissionsCount,
  onRevokePermission,
  onSwitchToAddTab,
  loading = false,
}: Readonly<CurrentPermissionsTabProps>) {
  const t = labels;

  if (permissionsCount === 0 && !loading) {
    return <CurrentPermissionsEmptyState t={t} onSwitchToAddTab={onSwitchToAddTab} />;
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
    <MobileCardList
      rows={groupPermissions}
      loading={loading}
      getKey={permission => permission.id ?? permission.key ?? ""}
      paginationOptions={{ mode: "client" }}
      layout="edge-to-edge"
      renderItem={permission => (
        <MobileCardListItem variant="edge-to-edge">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
              <StyledPermissionKeyChipShared>{permission.key}</StyledPermissionKeyChipShared>
              {permission.category ? (
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {permission.category}
                </Typography>
              ) : null}
            </Box>
            {permission.description ? (
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {permission.description}
              </Typography>
            ) : null}
            {permission.id ? (
              <StyledRevokeButtonShared
                size="small"
                startIcon={<RemoveCircleOutlined fontSize="small" />}
                onClick={() => permission.id && onRevokePermission(permission.id)}
              >
                {t.revoke}
              </StyledRevokeButtonShared>
            ) : null}
          </Box>
        </MobileCardListItem>
      )}
    />
  );
}
