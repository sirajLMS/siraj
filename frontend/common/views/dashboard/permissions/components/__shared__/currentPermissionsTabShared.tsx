"use client";

import { SecurityOutlined } from "@mui/icons-material";
import {
  StyledAssignFirstButtonShared,
  StyledEmptyStateContainerShared,
  StyledEmptyStateDescriptionShared,
  StyledEmptyStateIconCircleShared,
  StyledEmptyStateTitleShared,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/currentPermissionsTabShared.styles";
import type { CurrentPermissionsEmptyStateProps } from "@/frontend/common/views/dashboard/permissions/types/currentPermissionsTabShared.types";

export function CurrentPermissionsEmptyState({
  t,
  group,
  onSwitchToAddTab,
}: Readonly<CurrentPermissionsEmptyStateProps>) {
  return (
    <StyledEmptyStateContainerShared>
      <StyledEmptyStateIconCircleShared>
        <SecurityOutlined fontSize="large" sx={theme => ({ color: theme.palette.text.secondary })} />
      </StyledEmptyStateIconCircleShared>
      <StyledEmptyStateTitleShared variant="titleLg">{t.noPermissionsAssignedYet}</StyledEmptyStateTitleShared>
      <StyledEmptyStateDescriptionShared variant="bodyMd">
        {t.noPermissionsDescription}
      </StyledEmptyStateDescriptionShared>
      {!group.isSystem && (
        <StyledAssignFirstButtonShared variant="contained" onClick={onSwitchToAddTab}>
          {t.assignFirstPermission}
        </StyledAssignFirstButtonShared>
      )}
    </StyledEmptyStateContainerShared>
  );
}
