"use client";

import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
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
  readonly currentTab?: string;
  readonly onTabChange?: (tab: string) => void;
  readonly name?: string;
  readonly email?: string;
  readonly role?: string;
  readonly avatarUrl?: string | null;
};

import type { ProfileAudience, ProfileScope } from "@/backend/types/profile.types";

export function ProfileShell({
  title,
  subtitle,
  loading,
  error,
  actions,
  children,
  audience,
  scope,
  currentTab,
  onTabChange,
  name,
  email,
  role,
  avatarUrl,
}: ProfileShellProps) {
  const t = useTranslations("profile");

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {loading ? (
        <ProfileSkeleton />
      ) : error ? (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography sx={theme => ({ color: theme.palette.error.main })}>{error}</Typography>
          <Typography sx={{ mt: 2 }}>{t("shell.error.retry")}</Typography>
        </Box>
      ) : (
        <>
          <ProfileHeader name={name ?? ""} email={email ?? ""} role={role ?? ""} avatarUrl={avatarUrl} />
          <ProfileTabNav audience={audience} scope={scope} currentTab={currentTab} onTabChange={onTabChange} />
          {children}
        </>
      )}
    </PageContainer>
  );
}
