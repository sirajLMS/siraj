import type React from "react";
import type { SimulatablePermissionGroupsQuery_simulatablePermissionGroups } from "@/frontend/common/graphql/generated/gql/graphql";
import type { usePermissionGroupSimulation } from "@/frontend/common/hooks/usePermissionGroupSimulation";

export interface UserInfoSlotProps {
  readonly name: string;
  readonly mail: string;
  readonly secondaryLine?: string;
}

export interface LogoutButtonSlotProps {
  readonly onClick: () => void;
}

export type UserInfoSlotComponent = React.ComponentType<UserInfoSlotProps>;

export type LogoutButtonSlotComponent = React.ComponentType<LogoutButtonSlotProps>;

export type SimulationStatus = ReturnType<typeof usePermissionGroupSimulation>["status"];

export type SimulatableGroup = SimulatablePermissionGroupsQuery_simulatablePermissionGroups;

export interface UserProfileMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  displayName: string;
  displayEmail: string;
  actorSecondaryLine?: string;
  userInfoSlot: React.ComponentType<UserInfoSlotProps>;
  userInfoSlotProps?: Partial<UserInfoSlotProps>;
  logoutButtonSlot: React.ComponentType<LogoutButtonSlotProps>;
  logoutButtonSlotProps?: Partial<LogoutButtonSlotProps>;
  canViewOwnProfile: boolean;
  onProfileClick: () => void;
  isImpersonating: boolean;
  onEndImpersonation: () => void;
  impersonationLoading: boolean;
  isSimulatingGroup: boolean;
  onEndSimulation: () => void;
  simulationLoading: boolean;
  showGroupSimulationEntry: boolean;
  onOpenGroupMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onLogoutClick: () => void;
  labels: UserProfileMenuLabels;
}

export interface UserProfileMenuLabels {
  readonly profileTitle: string;
  readonly returnToNormalLogin: string;
  readonly returnToNormalRole: string;
  readonly switchRoleTo: string;
}
