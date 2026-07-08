"use client";

import { Box, Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { ProfileAudience, ProfileMode, ProfileScope } from "@/backend/types/profile.types";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileSkeleton } from "./ProfileSkeleton";
import { ProfileTabNav } from "./ProfileTabNav";

export type ProfileShellProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly audience: ProfileAudience;
  readonly scope: ProfileScope;
  readonly mode?: ProfileMode;
  readonly currentTab?: string;
  readonly onTabChange?: (tab: string) => void;
  readonly onRetry?: () => void;
  readonly name?: string;
  readonly email?: string;
  readonly role?: string;
  readonly avatarUrl?: string | null;
};

export function ProfileShell({
  title,
  subtitle,
  loading,
  error,
  actions,
  children,
  audience,
  scope,
  mode = "view",
  currentTab,
  onTabChange,
  onRetry,
  name,
  email,
  role,
  avatarUrl,
}: ProfileShellProps) {
  const t = useTranslations("profile");
  const showTabs = mode === "view" && currentTab && onTabChange;

  return (
    <PageContainer sx={{ px: { xs: 2, md: 0 } }}>
      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          gap: theme.layout.sectionGap,
          width: "100%",
        })}
      >
        <PageHeader title={title} subtitle={subtitle} actions={actions} />
        {loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography sx={theme => ({ color: theme.palette.error.main })}>{error}</Typography>
            <Typography sx={{ mt: 2, color: theme => theme.palette.text.secondary }}>
              {t("shell.error.retry")}
            </Typography>
            {onRetry ? (
              <Button variant="outlined" sx={{ mt: 2 }} onClick={onRetry}>
                {t("actions.retry")}
              </Button>
            ) : null}
          </Box>
        ) : (
          <Box
            sx={theme => ({
              display: "flex",
              flexDirection: "column",
              gap: theme.layout.sectionGap,
              width: "100%",
              animation: "profileContentEnter 0.3s ease-out",
              "@keyframes profileContentEnter": {
                from: { opacity: 0, transform: "translateY(8px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            })}
          >
            <ProfileHeader name={name ?? ""} email={email ?? ""} role={role ?? ""} avatarUrl={avatarUrl} />
            {showTabs ? (
              <ProfileTabNav audience={audience} scope={scope} currentTab={currentTab} onTabChange={onTabChange} />
            ) : null}
            <Box
              key={currentTab ?? "content"}
              sx={{
                animation: showTabs ? "profileTabFade 0.2s ease-out" : undefined,
                "@keyframes profileTabFade": {
                  from: { opacity: 0 },
                  to: { opacity: 1 },
                },
              }}
            >
              {children}
            </Box>
          </Box>
        )}
      </Box>
    </PageContainer>
  );
}
