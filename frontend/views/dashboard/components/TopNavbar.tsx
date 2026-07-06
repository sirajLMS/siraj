"use client";

import { SchoolOutlined } from "@mui/icons-material";
import { AppBar, alpha, Box, Toolbar, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { usePermissionGroupSimulation } from "@/frontend/hooks/usePermissionGroupSimulation";
import { LanguageSwitcher } from "@/frontend/views/dashboard/components/navbar/LanguageSwitcher";
import { ThemeSwitcher } from "@/frontend/views/dashboard/components/navbar/ThemeSwitcher";
import { MobileMenuButton } from "./client/MobileMenuButton";
import { NotificationButton } from "./navbar/NotificationButton";
import { UserMenuButton } from "./navbar/UserMenuButton";

interface TopNavbarProps {
  readonly userName: string;
  readonly userEmail: string;
  readonly userRole: string;
  readonly roleLabel: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
}

export function TopNavbar({ userName, userEmail, userRole, roleLabel, avatarUrl, notificationCount }: TopNavbarProps) {
  const t = useTranslations("dashboard");
  const { isSimulatingGroup, status: simulationStatus } = usePermissionGroupSimulation();

  const simulatedRoleName = simulationStatus?.groupName;
  const secondaryHeaderLine = isSimulatingGroup && simulatedRoleName ? simulatedRoleName : userRole;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: "100%",
        backgroundColor: theme => theme.palette.headerContainer,
        color: theme => theme.palette.onHeaderContainer,
        zIndex: theme => theme.zIndex.drawer + 1,
        boxShadow: theme => theme.palette.shadow.card,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          minHeight: theme => theme.layout.navbarHeight,
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
          <MobileMenuButton />

          <Box
            sx={theme => ({
              width: 40,
              height: 40,
              backgroundColor: alpha(theme.palette.onHeaderContainer, 0.15),
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <SchoolOutlined sx={{ fontSize: 24 }} />
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column" }}>
            <Typography
              variant="titleLg"
              sx={{
                color: theme => theme.palette.onHeaderContainer,
                lineHeight: 1.2,
              }}
            >
              {t("layout.appTitle")}
            </Typography>
            <Typography
              variant="labelMd"
              sx={{
                color: theme => alpha(theme.palette.onHeaderContainer, 0.7),
                lineHeight: 1.2,
              }}
            >
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>
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
                    isSimulatingGroup
                      ? theme.palette.onHeaderContainer
                      : alpha(theme.palette.onHeaderContainer, 0.7),
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
        </Box>
      </Toolbar>
    </AppBar>
  );
}
