// cspell:ignore: Hanken
"use client";

import { MenuOutlined, SchoolOutlined } from "@mui/icons-material";
import { AppBar, Avatar, alpha, Box, IconButton, Toolbar, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/frontend/views/dashboard/components/navbar/LanguageSwitcher";
import { ThemeSwitcher } from "@/frontend/views/dashboard/components/navbar/ThemeSwitcher";
import { NotificationButton } from "./navbar/NotificationButton";

interface TopNavbarProps {
  readonly userName: string;
  readonly userRole: string;
  readonly roleLabel: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
  readonly onMenuClick: () => void;
}

const BrandSection = ({ onMenuClick, roleLabel }: { onMenuClick: () => void; roleLabel: string }) => {
  const t = useTranslations("dashboard");

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
      <IconButton
        onClick={onMenuClick}
        sx={{
          display: { xs: "flex", md: "none" },
        }}
        aria-label="menu"
      >
        <MenuOutlined />
      </IconButton>

      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: theme => alpha(theme.palette.onHeaderContainer, 0.15),
          borderRadius: 2,
        }}
      >
        <SchoolOutlined sx={{ fontSize: 24 }} />
      </Avatar>

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Typography
          sx={{
            color: theme => theme.palette.onHeaderContainer,
            fontFamily: '"Hanken Grotesk", sans-serif',
            fontSize: "20px",
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {t("layout.appTitle")}
        </Typography>
        <Typography
          sx={{
            color: theme => alpha(theme.palette.onHeaderContainer, 0.7),
            fontFamily: '"Inter", sans-serif',
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.05em",
          }}
        >
          {roleLabel}
        </Typography>
      </Box>
    </Box>
  );
};

const UserProfileSection = ({
  userName,
  userRole,
  avatarUrl,
}: {
  userName: string;
  userRole: string;
  avatarUrl: string;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderLeft: { xs: "none", md: theme => `1px solid ${theme.palette.onHeaderContainer}` },
        pl: { xs: 0, md: 3 },
      }}
    >
      <Box sx={{ textAlign: "end", display: { xs: "none", sm: "block" } }}>
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {userName}
        </Typography>
        <Typography
          sx={{
            color: theme => alpha(theme.palette.onHeaderContainer, 0.7),
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            mt: 0.5,
          }}
        >
          {userRole}
        </Typography>
      </Box>
      <Avatar
        src={avatarUrl}
        alt={userName}
        sx={{
          width: { xs: 32, md: 40 },
          height: { xs: 32, md: 40 },
          border: theme => `2px solid ${theme.palette.onHeaderContainer}`,
        }}
      />
    </Box>
  );
};

export function TopNavbar({
  userName,
  userRole,
  roleLabel,
  avatarUrl,
  notificationCount,
  onMenuClick,
}: TopNavbarProps) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: "100%",
        bgcolor: theme => theme.palette.headerContainer,
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
        <BrandSection onMenuClick={onMenuClick} roleLabel={roleLabel} />

        {/* Right: Notifications + User info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>
          <ThemeSwitcher />
          <LanguageSwitcher />
          <NotificationButton notificationCount={notificationCount} onClick={() => {}} />
          <UserProfileSection userName={userName} userRole={userRole} avatarUrl={avatarUrl} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
