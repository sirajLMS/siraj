"use client";

import { Box } from "@mui/material";
import { TopNavbarIslandDesktop } from "@/frontend/desktop/views/dashboard/components/topNavbarIsland.desktop";

interface TopNavbarDesktopProps {
  readonly userName: string;
  readonly userEmail: string;
  readonly userRole: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
}

export function TopNavbarDesktop({
  userName,
  userEmail,
  userRole,
  avatarUrl,
  notificationCount,
}: Readonly<TopNavbarDesktopProps>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>
      <TopNavbarIslandDesktop
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        avatarUrl={avatarUrl}
        notificationCount={notificationCount}
      />
    </Box>
  );
}
