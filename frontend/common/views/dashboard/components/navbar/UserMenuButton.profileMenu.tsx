"use client";

import { Divider, Menu, type Theme } from "@mui/material";
import {
  EndImpersonationMenuItem,
  EndSimulationMenuItem,
  GroupSimulationMenuItem,
  ProfileMenuItem,
} from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.profileMenu.parts";
import type { UserProfileMenuProps } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.types";

const userProfileMenuPaperSx = (theme: Theme) => ({
  mt: 1.5,
  minWidth: 240,
  boxShadow: theme.palette.shadow.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  borderRadius: 2,
  backgroundColor: theme.palette.background.paper,
});

export function UserProfileMenu({
  anchorEl,
  open,
  onClose,
  displayName,
  displayEmail,
  actorSecondaryLine,
  userInfoSlot: UserInfo,
  userInfoSlotProps,
  logoutButtonSlot: LogoutButton,
  logoutButtonSlotProps,
  canViewOwnProfile,
  onProfileClick,
  isImpersonating,
  onEndImpersonation,
  impersonationLoading,
  isSimulatingGroup,
  onEndSimulation,
  simulationLoading,
  showGroupSimulationEntry,
  onOpenGroupMenu,
  onLogoutClick,
  labels,
}: Readonly<UserProfileMenuProps>) {
  return (
    <Menu
      id="user-profile-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      slotProps={{
        paper: {
          sx: userProfileMenuPaperSx,
        },
      }}
    >
      <UserInfo name={displayName} mail={displayEmail} secondaryLine={actorSecondaryLine} {...userInfoSlotProps} />

      {canViewOwnProfile ? <ProfileMenuItem onProfileClick={onProfileClick} labels={labels} /> : null}

      {isImpersonating ? (
        <EndImpersonationMenuItem
          onEndImpersonation={onEndImpersonation}
          impersonationLoading={impersonationLoading}
          labels={labels}
        />
      ) : null}

      {isSimulatingGroup ? (
        <EndSimulationMenuItem
          onEndSimulation={onEndSimulation}
          simulationLoading={simulationLoading}
          labels={labels}
        />
      ) : null}

      {showGroupSimulationEntry ? (
        <GroupSimulationMenuItem
          onOpenGroupMenu={onOpenGroupMenu}
          simulationLoading={simulationLoading}
          isSimulatingGroup={isSimulatingGroup}
          labels={labels}
        />
      ) : null}

      {showGroupSimulationEntry ? <Divider sx={{ my: 1 }} /> : null}

      {!isImpersonating && (
        <>
          <Divider sx={{ my: 1 }} />
          <LogoutButton onClick={onLogoutClick} {...logoutButtonSlotProps} />
        </>
      )}
    </Menu>
  );
}
