"use client";

import { useQuery } from "@apollo/client/react";
import type React from "react";
import { useMemo, useState } from "react";
import { simulatablePermissionGroupsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAuth } from "@/frontend/common/hooks/useAuth";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { usePermissionGroupSimulation } from "@/frontend/common/hooks/usePermissionGroupSimulation";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ownProfileHref } from "@/frontend/common/utils/profileHref";
import { computeSecondaryLine } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.helpers";
import type {
  SimulationStatus,
  UserProfileMenuLabels,
} from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.types";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface UserMenuIdentity {
  readonly isImpersonating: boolean;
  readonly isSimulatingGroup: boolean;
  readonly impersonationLoading: boolean;
  readonly simulationLoading: boolean;
  readonly simulationStatus: SimulationStatus;
  readonly displayName: string;
  readonly displayEmail: string;
  readonly actorSecondaryLine?: string;
  readonly actorUserName?: string;
  readonly showGroupSimulationEntry: boolean;
  readonly endImpersonation: ReturnType<typeof useImpersonation>["endImpersonation"];
  readonly startSimulation: ReturnType<typeof usePermissionGroupSimulation>["startSimulation"];
  readonly endSimulation: ReturnType<typeof usePermissionGroupSimulation>["endSimulation"];
  readonly menuLabels: Readonly<UserProfileMenuLabels>;
}

export function useUserMenuIdentity({ userName, userEmail }: Readonly<{ userName: string; userEmail: string }>) {
  const tProfile = useAppTranslation(Translation.Profile.Base);
  const tImpersonation = useAppTranslation(Translation.Auth.Impersonation);
  const tGroupSimulation = useAppTranslation(Translation.Auth.GroupSimulation);
  const actorIsSuperAdmin = useUserStore(state => state.actorIsSuperAdmin);
  const {
    isImpersonating,
    status: impersonationStatus,
    endImpersonation,
    loading: impersonationLoading,
  } = useImpersonation();
  const {
    isSimulatingGroup,
    status: simulationStatus,
    startSimulation,
    endSimulation,
    loading: simulationLoading,
  } = usePermissionGroupSimulation();

  const targetUser = impersonationStatus?.targetUser;
  const actorUser = impersonationStatus?.actorUser;
  const displayName = isImpersonating ? (targetUser?.name ?? userName) : userName;
  const displayEmail = isImpersonating ? (targetUser?.email ?? userEmail) : userEmail;
  const actorSecondaryLine = computeSecondaryLine(
    { isImpersonating, isSimulatingGroup, impersonationStatus, simulationStatus },
    tImpersonation
  );

  const identity: UserMenuIdentity = {
    isImpersonating,
    isSimulatingGroup,
    impersonationLoading,
    simulationLoading,
    simulationStatus,
    displayName,
    displayEmail,
    actorSecondaryLine,
    actorUserName: actorUser?.name ?? undefined,
    showGroupSimulationEntry: !isImpersonating && (isSimulatingGroup || actorIsSuperAdmin),
    endImpersonation,
    startSimulation,
    endSimulation,
    menuLabels: {
      profileTitle: tProfile.pageTitle,
      returnToNormalLogin: tImpersonation.returnToNormalLogin,
      returnToNormalRole: tGroupSimulation.returnToNormalRole,
      switchRoleTo: tGroupSimulation.switchRoleTo,
    },
  };
  return identity;
}

export function useUserMenuPanels({
  onLogout,
  identity,
}: Readonly<{
  onLogout?: () => void;
  identity: Readonly<UserMenuIdentity>;
}>) {
  const { logout } = useAuth();
  const router = useRouter();
  const { isSimulatingGroup, showGroupSimulationEntry, simulationStatus } = identity;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const groupMenuOpen = Boolean(groupMenuAnchor);

  const { data: groupsData, loading: groupsLoading } = useQuery(simulatablePermissionGroupsQueryDocument, {
    skip: !open || !showGroupSimulationEntry,
    fetchPolicy: "network-only",
  });

  const simulatedGroupSlug = simulationStatus?.groupSlug;
  const simulatableGroups = useMemo(() => {
    const groups = groupsData?.simulatablePermissionGroups ?? [];
    if (isSimulatingGroup && simulatedGroupSlug) {
      return groups.filter(group => group.slug !== simulatedGroupSlug);
    }
    return groups;
  }, [groupsData?.simulatablePermissionGroups, isSimulatingGroup, simulatedGroupSlug]);

  const handleClose = () => {
    setAnchorEl(null);
    setGroupMenuAnchor(null);
  };

  const handleProfileClick = () => {
    handleClose();
    router.push(ownProfileHref());
  };

  const handleLogoutClick = () => {
    handleClose();
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  return {
    anchorEl,
    groupMenuAnchor,
    open,
    groupMenuOpen,
    groupsLoading,
    simulatableGroups,
    openMenu: (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget),
    openGroupMenu: (event: React.MouseEvent<HTMLElement>) => setGroupMenuAnchor(event.currentTarget),
    closeGroupMenu: () => setGroupMenuAnchor(null),
    handleClose,
    handleProfileClick,
    handleLogoutClick,
  };
}
