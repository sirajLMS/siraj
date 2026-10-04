"use client";

import { GroupsOutlined, LoginOutlined, PersonOutlined } from "@mui/icons-material";
import { MenuItem, Typography } from "@mui/material";
import type React from "react";
import type { UserProfileMenuLabels } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.types";

interface MenuActionItemProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly onClick: (event: React.MouseEvent<HTMLElement>) => void;
  readonly disabled: boolean;
  readonly emphasized: boolean;
  readonly mt?: number;
}

function MenuActionItem({ icon, label, onClick, disabled, emphasized, mt }: Readonly<MenuActionItemProps>) {
  return (
    <MenuItem onClick={onClick} disabled={disabled} sx={{ gap: 1.5, mx: 1.5, mt, borderRadius: 1 }}>
      {icon}
      <Typography variant="bodyMd" sx={{ fontWeight: emphasized ? 600 : 500 }}>
        {label}
      </Typography>
    </MenuItem>
  );
}

export function ProfileMenuItem({
  onProfileClick,
  labels,
}: Readonly<{
  onProfileClick: (event: React.MouseEvent<HTMLElement>) => void;
  labels: UserProfileMenuLabels;
}>) {
  return (
    <MenuActionItem
      icon={<PersonOutlined fontSize="small" />}
      label={labels.profileTitle}
      onClick={onProfileClick}
      disabled={false}
      emphasized={false}
    />
  );
}

export function EndImpersonationMenuItem({
  onEndImpersonation,
  impersonationLoading,
  labels,
}: Readonly<{
  onEndImpersonation: (event: React.MouseEvent<HTMLElement>) => void;
  impersonationLoading: boolean;
  labels: UserProfileMenuLabels;
}>) {
  return (
    <MenuActionItem
      icon={<LoginOutlined fontSize="small" />}
      label={labels.returnToNormalLogin}
      onClick={onEndImpersonation}
      disabled={impersonationLoading}
      emphasized
    />
  );
}

export function EndSimulationMenuItem({
  onEndSimulation,
  simulationLoading,
  labels,
}: Readonly<{
  onEndSimulation: (event: React.MouseEvent<HTMLElement>) => void;
  simulationLoading: boolean;
  labels: UserProfileMenuLabels;
}>) {
  return (
    <MenuActionItem
      icon={<LoginOutlined fontSize="small" />}
      label={labels.returnToNormalRole}
      onClick={onEndSimulation}
      disabled={simulationLoading}
      emphasized
    />
  );
}

export function GroupSimulationMenuItem({
  onOpenGroupMenu,
  simulationLoading,
  isSimulatingGroup,
  labels,
}: Readonly<{
  onOpenGroupMenu: (event: React.MouseEvent<HTMLElement>) => void;
  simulationLoading: boolean;
  isSimulatingGroup: boolean;
  labels: UserProfileMenuLabels;
}>) {
  return (
    <MenuActionItem
      icon={<GroupsOutlined fontSize="small" />}
      label={labels.switchRoleTo}
      onClick={onOpenGroupMenu}
      disabled={simulationLoading}
      emphasized={false}
      mt={isSimulatingGroup ? 0.5 : 0}
    />
  );
}
