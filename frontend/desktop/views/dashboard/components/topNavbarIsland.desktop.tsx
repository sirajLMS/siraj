"use client";

import { alpha, Box, Typography } from "@mui/material";
import { usePermissionGroupSimulation } from "@/frontend/common/hooks/usePermissionGroupSimulation";
import { formatUserRoleLabel } from "@/frontend/common/utils/formatUserRoleLabel";
import {
  LanguageSwitcher,
  NotificationButton,
  ThemeSwitcher,
  UserMenuButton,
} from "@/frontend/common/views/dashboard/components/navbar";

interface TopNavbarIslandDesktopProps {
  readonly userName: string;
  readonly userEmail: string;
  readonly userRole: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
}

export function TopNavbarIslandDesktop({
  userName,
  userEmail,
  userRole,
  avatarUrl,
  notificationCount,
}: Readonly<TopNavbarIslandDesktopProps>) {
  const { isSimulatingGroup, status: simulationStatus } = usePermissionGroupSimulation();

  const simulatedRoleName = simulationStatus?.groupName;
  const secondaryHeaderLine =
    isSimulatingGroup && simulatedRoleName ? simulatedRoleName : formatUserRoleLabel(userRole);

  return (
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
  );
}
