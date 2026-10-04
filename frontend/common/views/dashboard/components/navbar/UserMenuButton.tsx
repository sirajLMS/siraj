"use client";

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  DefaultLogoutButton,
  DefaultUserInfo,
} from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.defaults";
import {
  useUserMenuIdentity,
  useUserMenuPanels,
} from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.hooks";
import { GroupSimulationMenu } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.menu";
import { UserProfileMenu } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.profileMenu";
import { UserMenuTrigger } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.trigger";
import type {
  LogoutButtonSlotComponent,
  LogoutButtonSlotProps,
  UserInfoSlotComponent,
  UserInfoSlotProps,
} from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface UserMenuButtonProps {
  readonly userName: string;
  readonly userEmail: string;
  readonly avatarUrl: string;
  readonly onLogout?: () => void;
  readonly slots?: {
    readonly userInfo?: UserInfoSlotComponent;
    readonly logoutButton?: LogoutButtonSlotComponent;
  };
  readonly slotProps?: {
    readonly userInfo?: Partial<UserInfoSlotProps>;
    readonly logoutButton?: Partial<LogoutButtonSlotProps>;
  };
}

const EMPTY_SLOTS: NonNullable<UserMenuButtonProps["slots"]> = {};
const EMPTY_SLOT_PROPS: NonNullable<UserMenuButtonProps["slotProps"]> = {};

export function UserMenuButton({
  userName,
  userEmail,
  avatarUrl,
  onLogout,
  slots = EMPTY_SLOTS,
  slotProps = EMPTY_SLOT_PROPS,
}: Readonly<UserMenuButtonProps>) {
  const tCommon = useAppTranslation(Translation.Common);
  const canViewOwnProfile = useUserStore(state => state.hasPermission(AppPermission.ProfileCoreIdentityViewOwn));
  const identity = useUserMenuIdentity({ userName, userEmail });
  const panels = useUserMenuPanels({ onLogout, identity });

  return (
    <>
      <UserMenuTrigger
        userName={userName}
        avatarUrl={avatarUrl}
        displayName={identity.displayName}
        isImpersonating={identity.isImpersonating}
        isSimulatingGroup={identity.isSimulatingGroup}
        simulationStatus={identity.simulationStatus}
        actorUserName={identity.actorUserName}
        open={panels.open}
        onClick={panels.openMenu}
      />

      <UserProfileMenu
        anchorEl={panels.anchorEl}
        open={panels.open}
        onClose={panels.handleClose}
        displayName={identity.displayName}
        displayEmail={identity.displayEmail}
        actorSecondaryLine={identity.actorSecondaryLine}
        userInfoSlot={slots.userInfo ?? DefaultUserInfo}
        userInfoSlotProps={slotProps.userInfo}
        logoutButtonSlot={slots.logoutButton ?? DefaultLogoutButton}
        logoutButtonSlotProps={slotProps.logoutButton}
        canViewOwnProfile={canViewOwnProfile}
        onProfileClick={panels.handleProfileClick}
        isImpersonating={identity.isImpersonating}
        onEndImpersonation={() => {
          panels.handleClose();
          void identity.endImpersonation();
        }}
        impersonationLoading={identity.impersonationLoading}
        isSimulatingGroup={identity.isSimulatingGroup}
        onEndSimulation={() => {
          panels.handleClose();
          void identity.endSimulation();
        }}
        simulationLoading={identity.simulationLoading}
        showGroupSimulationEntry={identity.showGroupSimulationEntry}
        onOpenGroupMenu={panels.openGroupMenu}
        onLogoutClick={panels.handleLogoutClick}
        labels={identity.menuLabels}
      />

      <GroupSimulationMenu
        anchorEl={panels.groupMenuAnchor}
        open={panels.groupMenuOpen}
        onClose={panels.closeGroupMenu}
        groupsLoading={panels.groupsLoading}
        simulatableGroups={panels.simulatableGroups}
        simulationLoading={identity.simulationLoading}
        onSelectGroup={slug => {
          panels.handleClose();
          void identity.startSimulation(slug);
        }}
        tCommon={tCommon}
      />
    </>
  );
}
