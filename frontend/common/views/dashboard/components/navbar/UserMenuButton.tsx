"use client";

import { useQuery } from "@apollo/client/react";
import { GroupsOutlined, LoginOutlined, LogoutOutlined, PersonOutlineOutlined } from "@mui/icons-material";
import { Box, ButtonBase, Divider, Menu, MenuItem, Typography } from "@mui/material";
import type React from "react";
import { useMemo, useState } from "react";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import { AppPermission, type SimulatablePermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { simulatablePermissionGroupsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAuth } from "@/frontend/common/hooks/useAuth";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { usePermissionGroupSimulation } from "@/frontend/common/hooks/usePermissionGroupSimulation";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ownProfileHref } from "@/frontend/common/utils/profileHref";
import { useRouter } from "@/shared/i18n/navigation";
import { type AuthImpersonationLabels, type CommonLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface UserInfoSlotProps {
  readonly name: string;
  readonly mail: string;
  readonly secondaryLine?: string;
}

export interface LogoutButtonSlotProps {
  readonly onClick: () => void;
}

export interface UserMenuButtonProps {
  readonly userName: string;
  readonly userEmail: string;
  readonly avatarUrl: string;
  readonly onLogout?: () => void;
  readonly slots?: {
    readonly userInfo?: React.ComponentType<UserInfoSlotProps>;
    readonly logoutButton?: React.ComponentType<LogoutButtonSlotProps>;
  };
  readonly slotProps?: {
    readonly userInfo?: Partial<UserInfoSlotProps>;
    readonly logoutButton?: Partial<LogoutButtonSlotProps>;
  };
}

const EMPTY_SLOTS: NonNullable<UserMenuButtonProps["slots"]> = {};
const EMPTY_SLOT_PROPS: NonNullable<UserMenuButtonProps["slotProps"]> = {};

function DefaultUserInfo({ name, mail, secondaryLine }: Readonly<UserInfoSlotProps>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        px: 2.5,
        py: 1.5,
      }}
    >
      <Typography
        variant="bodyLg"
        sx={theme => ({
          fontWeight: 600,
          color: theme.palette.onSurface,
        })}
      >
        {name}
      </Typography>
      {secondaryLine ? (
        <Typography
          variant="labelSm"
          sx={theme => ({
            color: theme.palette.onSurfaceVariant,
            mt: 0.25,
          })}
        >
          {secondaryLine}
        </Typography>
      ) : null}
      <Typography
        variant="bodyMd"
        sx={theme => ({
          color: theme.palette.onSurfaceVariant,
          mt: secondaryLine ? 0.5 : 0,
        })}
      >
        {mail}
      </Typography>
    </Box>
  );
}

function DefaultLogoutButton({ onClick }: Readonly<LogoutButtonSlotProps>) {
  const t = useAppTranslation(Translation.Dashboard.CoreNav);
  return (
    <MenuItem
      onClick={onClick}
      sx={theme => ({
        gap: 1.5,
        color: theme.palette.error.main,
        borderRadius: 1,
        mx: 1.5,
        mb: 1,
        py: 1,
        "&:hover": {
          backgroundColor: theme.palette.errorContainer,
          color: theme.palette.onErrorContainer,
        },
      })}
    >
      <LogoutOutlined fontSize="small" />
      <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
        {t.logout}
      </Typography>
    </MenuItem>
  );
}

function DualAvatarTrigger({
  primaryAvatarUrl,
  primaryName,
  secondaryAvatarUrl,
  secondaryName,
}: Readonly<{
  primaryAvatarUrl: string;
  primaryName: string;
  secondaryAvatarUrl?: string;
  secondaryName?: string;
}>) {
  return (
    <Box sx={{ position: "relative", width: { xs: 40, md: 48 }, height: { xs: 32, md: 40 } }}>
      <UserAvatar
        src={primaryAvatarUrl}
        label={primaryName}
        size={34}
        sx={{
          width: { xs: 28, md: 34 },
          height: { xs: 28, md: 34 },
          position: "absolute",
          left: 0,
          bottom: 0,
          border: theme => `2px solid ${theme.palette.headerContainer}`,
        }}
      />
      <UserAvatar
        src={secondaryAvatarUrl}
        label={secondaryName ?? ""}
        size={28}
        sx={{
          width: { xs: 24, md: 28 },
          height: { xs: 24, md: 28 },
          position: "absolute",
          right: 0,
          top: 0,
          border: theme => `2px solid ${theme.palette.headerContainer}`,
        }}
      />
    </Box>
  );
}

interface UserMenuState {
  readonly isImpersonating: boolean;
  readonly isSimulatingGroup: boolean;
  readonly impersonationStatus: ReturnType<typeof useImpersonation>["status"];
  readonly simulationStatus: ReturnType<typeof usePermissionGroupSimulation>["status"];
}

function computeSecondaryLine(
  state: Readonly<UserMenuState>,
  tImpersonation: AuthImpersonationLabels
): string | undefined {
  const { isImpersonating, isSimulatingGroup, impersonationStatus, simulationStatus } = state;
  if (isImpersonating) {
    const actorName = impersonationStatus?.actorUser?.name;
    return actorName ? tImpersonation.actorIdentity(actorName) : undefined;
  }
  if (isSimulatingGroup && simulationStatus?.groupName) {
    return simulationStatus.groupName;
  }
  return undefined;
}

function UserMenuTrigger({
  userName,
  avatarUrl,
  displayName,
  isImpersonating,
  isSimulatingGroup,
  simulationStatus,
  actorUserName,
  open,
  onClick,
}: Readonly<{
  userName: string;
  avatarUrl: string;
  displayName: string;
  isImpersonating: boolean;
  isSimulatingGroup: boolean;
  simulationStatus: ReturnType<typeof usePermissionGroupSimulation>["status"];
  actorUserName?: string;
  open: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}>) {
  const tCommon = useAppTranslation(Translation.Common);
  return (
    <ButtonBase
      onClick={onClick}
      sx={theme => ({
        borderRadius: isImpersonating || isSimulatingGroup ? 2 : "50%",
        padding: 0.5,
        border: isImpersonating || isSimulatingGroup ? "none" : `2px solid ${theme.palette.onHeaderContainer}`,
        transition: "all 0.2s ease-in-out",
        display: "flex",
        alignItems: "center",
        gap: 1,
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: theme.palette.shadow.cardHover,
        },
      })}
      aria-label={tCommon.ariaUserProfileMenu}
      aria-controls={open ? "user-profile-menu" : undefined}
      aria-haspopup="true"
      aria-expanded={open ? "true" : undefined}
    >
      {isSimulatingGroup && simulationStatus?.groupName ? (
        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            flexDirection: "column",
            alignItems: "flex-end",
            minWidth: 0,
            maxWidth: 120,
          }}
        >
          <Typography variant="labelMd" noWrap sx={{ fontWeight: 500, lineHeight: 1.2 }}>
            {userName}
          </Typography>
          <Typography variant="labelSm" noWrap sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {simulationStatus.groupName}
          </Typography>
        </Box>
      ) : null}
      {isImpersonating ? (
        <DualAvatarTrigger
          primaryAvatarUrl={avatarUrl}
          primaryName={displayName}
          secondaryAvatarUrl={avatarUrl}
          secondaryName={actorUserName ?? undefined}
        />
      ) : (
        <UserAvatar
          src={avatarUrl}
          label={userName}
          size={40}
          sx={{
            width: { xs: 32, md: 40 },
            height: { xs: 32, md: 40 },
          }}
        />
      )}
    </ButtonBase>
  );
}

function GroupSimulationMenu({
  anchorEl,
  open,
  onClose,
  groupsLoading,
  simulatableGroups,
  simulationLoading,
  onSelectGroup,
  tCommon,
}: Readonly<{
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  groupsLoading: boolean;
  simulatableGroups: ReadonlyArray<SimulatablePermissionGroup>;
  simulationLoading: boolean;
  onSelectGroup: (slug: string) => void;
  tCommon: CommonLabels;
}>) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: theme => ({
            ml: -1,
            minWidth: 220,
            maxHeight: 320,
            boxShadow: theme.palette.shadow.card,
            border: `1px solid ${theme.palette.outlineVariant}`,
            borderRadius: 2,
          }),
        },
      }}
    >
      {groupsLoading ? (
        <MenuItem disabled>
          <Typography variant="bodyMd">{tCommon.loading}</Typography>
        </MenuItem>
      ) : (
        simulatableGroups.map(group => (
          <MenuItem key={group.slug} disabled={simulationLoading} onClick={() => onSelectGroup(group.slug ?? "")}>
            <Typography variant="bodyMd">{group.name}</Typography>
          </MenuItem>
        ))
      )}
    </Menu>
  );
}

export function UserMenuButton({
  userName,
  userEmail,
  avatarUrl,
  onLogout,
  slots = EMPTY_SLOTS,
  slotProps = EMPTY_SLOT_PROPS,
}: Readonly<UserMenuButtonProps>) {
  const { logout } = useAuth();
  const router = useRouter();
  const tCommon = useAppTranslation(Translation.Common);
  const tProfile = useAppTranslation(Translation.Profile.Base);
  const tImpersonation = useAppTranslation(Translation.Auth.Impersonation);
  const tGroupSimulation = useAppTranslation(Translation.Auth.GroupSimulation);
  const actorIsSuperAdmin = useUserStore(state => state.actorIsSuperAdmin);
  const canViewOwnProfile = useUserStore(state => state.hasPermission(AppPermission.ProfileCoreIdentityViewOwn));
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

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const groupMenuOpen = Boolean(groupMenuAnchor);

  const canSwitchRoles = !isImpersonating && (isSimulatingGroup || actorIsSuperAdmin);
  const showGroupSimulationEntry = canSwitchRoles;

  const { data: groupsData, loading: groupsLoading } = useQuery(simulatablePermissionGroupsQueryDocument, {
    skip: !open || !showGroupSimulationEntry,
    fetchPolicy: "network-only",
  });

  const simulatableGroups = useMemo(() => {
    const groups = groupsData?.simulatablePermissionGroups ?? [];
    if (isSimulatingGroup && simulationStatus?.groupSlug) {
      return groups.filter(group => group.slug !== simulationStatus.groupSlug);
    }
    return groups;
  }, [groupsData?.simulatablePermissionGroups, isSimulatingGroup, simulationStatus?.groupSlug]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

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

  const UserInfo = slots.userInfo ?? DefaultUserInfo;
  const LogoutButton = slots.logoutButton ?? DefaultLogoutButton;

  const targetUser = impersonationStatus?.targetUser;
  const actorUser = impersonationStatus?.actorUser;
  const displayName = isImpersonating ? (targetUser?.name ?? userName) : userName;
  const displayEmail = isImpersonating ? (targetUser?.email ?? userEmail) : userEmail;

  const actorSecondaryLine = computeSecondaryLine(
    { isImpersonating, isSimulatingGroup, impersonationStatus, simulationStatus },
    tImpersonation
  );

  const triggerProps: Readonly<{
    userName: string;
    avatarUrl: string;
    displayName: string;
    isImpersonating: boolean;
    isSimulatingGroup: boolean;
    simulationStatus: ReturnType<typeof usePermissionGroupSimulation>["status"];
    actorUserName?: string;
    open: boolean;
    onClick: (event: React.MouseEvent<HTMLElement>) => void;
  }> = {
    userName,
    avatarUrl,
    displayName,
    isImpersonating,
    isSimulatingGroup,
    simulationStatus,
    actorUserName: actorUser?.name ?? undefined,
    open,
    onClick: handleClick,
  };

  return (
    <>
      <UserMenuTrigger {...triggerProps} />

      <Menu
        id="user-profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
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
            sx: theme => ({
              mt: 1.5,
              minWidth: 240,
              boxShadow: theme.palette.shadow.card,
              border: `1px solid ${theme.palette.outlineVariant}`,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
            }),
          },
        }}
      >
        <UserInfo name={displayName} mail={displayEmail} secondaryLine={actorSecondaryLine} {...slotProps.userInfo} />

        {canViewOwnProfile ? (
          <MenuItem onClick={handleProfileClick} sx={{ gap: 1.5, mx: 1.5, borderRadius: 1 }}>
            <PersonOutlineOutlined fontSize="small" />
            <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
              {tProfile.pageTitle}
            </Typography>
          </MenuItem>
        ) : null}

        {isImpersonating ? (
          <MenuItem
            onClick={() => {
              handleClose();
              void endImpersonation();
            }}
            disabled={impersonationLoading}
            sx={{ gap: 1.5, mx: 1.5, borderRadius: 1 }}
          >
            <LoginOutlined fontSize="small" />
            <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
              {tImpersonation.returnToNormalLogin}
            </Typography>
          </MenuItem>
        ) : null}

        {isSimulatingGroup ? (
          <MenuItem
            onClick={() => {
              handleClose();
              void endSimulation();
            }}
            disabled={simulationLoading}
            sx={{ gap: 1.5, mx: 1.5, borderRadius: 1 }}
          >
            <LoginOutlined fontSize="small" />
            <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
              {tGroupSimulation.returnToNormalRole}
            </Typography>
          </MenuItem>
        ) : null}

        {showGroupSimulationEntry ? (
          <MenuItem
            onClick={event => setGroupMenuAnchor(event.currentTarget)}
            disabled={simulationLoading}
            sx={{ gap: 1.5, mx: 1.5, borderRadius: 1, mt: isSimulatingGroup ? 0.5 : 0 }}
          >
            <GroupsOutlined fontSize="small" />
            <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
              {tGroupSimulation.switchRoleTo}
            </Typography>
          </MenuItem>
        ) : null}

        {showGroupSimulationEntry ? <Divider sx={{ my: 1 }} /> : null}

        {!isImpersonating && (
          <>
            <Divider sx={{ my: 1 }} />
            <LogoutButton onClick={handleLogoutClick} {...slotProps.logoutButton} />
          </>
        )}
      </Menu>

      <GroupSimulationMenu
        anchorEl={groupMenuAnchor}
        open={groupMenuOpen}
        onClose={() => setGroupMenuAnchor(null)}
        groupsLoading={groupsLoading}
        simulatableGroups={simulatableGroups}
        simulationLoading={simulationLoading}
        onSelectGroup={slug => {
          handleClose();
          void startSimulation(slug);
        }}
        tCommon={tCommon}
      />
    </>
  );
}
