"use client";

import { alpha, Box, Typography } from "@mui/material";
import { usePermissionGroupSimulation } from "@/frontend/hooks/usePermissionGroupSimulation";
import { formatUserRoleLabel } from "@/frontend/utils/formatUserRoleLabel";
import { LanguageSwitcher, NavbarChrome, NotificationButton, ThemeSwitcher, UserMenuButton } from "./navbar";

interface TopNavbarProps {
  readonly userName: string;
  readonly userEmail: string;
  readonly userRole: string;
  readonly roleLabel: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
}

export function TopNavbar({
  userName,
  userEmail,
  userRole,
  roleLabel,
  avatarUrl,
  notificationCount,
}: Readonly<TopNavbarProps>) {
  const { isSimulatingGroup, status: simulationStatus } = usePermissionGroupSimulation();

  const simulatedRoleName = simulationStatus?.groupName;
  const secondaryHeaderLine =
    isSimulatingGroup && simulatedRoleName ? simulatedRoleName : formatUserRoleLabel(userRole);

  return (
    <NavbarChrome
      roleLabel={roleLabel}
      rightSlot={
        <>
          <ThemeSwitcher />
          <LanguageSwitcher />
          <NotificationButton notificationCount={notificationCount} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderLeft: { xs: "none", md: theme => `1px solid ${theme.palette.onHeaderContainer}` },
              pl: { xs: 0, md: 3 },
            }}
          >
            <Box
              sx={{
                textAlign: "end",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                minWidth: 0,
              }}
            >
              <Typography
                variant="labelMd"
                sx={{
                  fontWeight: 500,
                  lineHeight: 1.2,
                  display: { xs: "none", sm: "block" },
                }}
              >
                {userName}
              </Typography>
              <Typography
                variant={isSimulatingGroup ? "labelMd" : "labelSm"}
                sx={{
                  color: theme =>
                    isSimulatingGroup ? theme.palette.onHeaderContainer : alpha(theme.palette.onHeaderContainer, 0.7),
                  mt: 0.25,
                  lineHeight: 1.2,
                  fontWeight: isSimulatingGroup ? 600 : 400,
                  display: { xs: "none", sm: "block" },
                }}
              >
                {secondaryHeaderLine}
              </Typography>
            </Box>

            <UserMenuButton userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
          </Box>
        </>
      }
    />
  );
}
