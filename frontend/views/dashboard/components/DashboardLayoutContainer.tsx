"use client";

import type { ErrorLike } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { ErrorOutlined as ErrorIcon } from "@mui/icons-material";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import type { User } from "@/frontend/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/graphql/sharedDocuments/auth.documents";
import { useLayoutStore } from "@/frontend/stores/layoutStore";
import { useUserStore } from "@/frontend/stores/userStore";
import {
  BOTTOM_NAV_ITEMS,
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/views/dashboard/config/navigationConfig";
import { DashboardLayout } from "./DashboardLayout";

interface DashboardLayoutContainerProps {
  readonly children: ReactNode;
}

interface DashboardErrorViewProps {
  readonly isTimedOut: boolean;
  readonly error: ErrorLike | undefined;
  readonly user: User | null;
  readonly onRetry: () => void;
  readonly onLoginRedirect: () => void;
  readonly t: (key: string) => string;
}

function DashboardErrorView({ isTimedOut, error, user, onRetry, onLoginRedirect, t }: DashboardErrorViewProps) {
  let errorTitle: string;
  let errorDesc: string;

  if (isTimedOut) {
    errorTitle = t("loadingTimeoutTitle");
    errorDesc = t("loadingTimeoutDesc");
  } else if (!user && !error) {
    errorTitle = t("unauthenticatedTitle");
    errorDesc = t("unauthenticatedDesc");
  } else {
    errorTitle = t("loadingFailedTitle");
    errorDesc = error?.message || t("loadingFailedDesc");
  }

  const showRetry = isTimedOut || !!error;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 2,
        p: 3,
        textAlign: "center",
      }}
    >
      <ErrorIcon color="error" sx={{ fontSize: 48 }} />
      <Typography variant="h6" color="text.primary">
        {errorTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 1 }}>
        {errorDesc}
      </Typography>
      {showRetry ? (
        <Button variant="contained" onClick={onRetry}>
          {t("retryBtn")}
        </Button>
      ) : (
        <Button variant="contained" onClick={onLoginRedirect}>
          {t("loginBtn")}
        </Button>
      )}
    </Box>
  );
}

export function DashboardLayoutContainer({ children }: DashboardLayoutContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("dashboard.admin");

  const { data, loading, error, refetch } = useQuery(meQueryDocument);
  const { setUser, user } = useUserStore();
  const { sidebarOpen, mobileDrawerOpen, toggleSidebar, toggleMobileDrawer, closeMobileDrawer } = useLayoutStore();

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
    }
  }, [data, setUser]);

  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsTimedOut(false);
      return;
    }

    setIsTimedOut(false);

    const timer = setTimeout(() => {
      setIsTimedOut(true);
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !isTimedOut) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user || isTimedOut) {
    return (
      <DashboardErrorView
        isTimedOut={isTimedOut}
        error={error}
        user={user}
        onRetry={() => refetch()}
        onLoginRedirect={() => router.push(`/${locale}/login`)}
        t={t}
      />
    );
  }

  // Derive filtered nav items from permissions
  const sidebarItems = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, user.permissions || []);
  const bottomNavItems = getNavItemsForPermissions(BOTTOM_NAV_ITEMS, user.permissions || []);

  // Determine active nav key from current pathname
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/dashboard";
  const activeNavKey = sidebarItems.find(item => pathWithoutLocale.startsWith(item.href))?.key ?? "home";

  const handleNavigate = (href: string) => {
    router.push(`/${locale}${href}`);
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      bottomNavItems={bottomNavItems}
      activeNavKey={activeNavKey}
      userName={user.name || ""}
      userEmail={user.email || ""}
      userRole={user.role || ""}
      roleLabel={t("roleLabel")}
      avatarUrl={user.avatarUrl || ""}
      notificationCount={user.notificationCount ?? 0}
      sidebarWidth="260px"
      navbarHeight="64px"
      sidebarOpen={sidebarOpen}
      mobileDrawerOpen={mobileDrawerOpen}
      onToggleSidebar={toggleSidebar}
      onToggleMobileDrawer={toggleMobileDrawer}
      onCloseMobileDrawer={closeMobileDrawer}
      onNavigate={handleNavigate}
    >
      {children}
    </DashboardLayout>
  );
}
