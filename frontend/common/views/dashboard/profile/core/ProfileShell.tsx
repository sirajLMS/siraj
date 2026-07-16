"use client";

import { Box, Button, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { PageContainer } from "@/frontend/common/components/ui";
import {
  type ProfileAudience,
  ProfileMode,
  type ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileHeader } from "@/frontend/common/views/dashboard/profile/core/ProfileHeader";
import { ProfileSkeleton } from "@/frontend/common/views/dashboard/profile/core/ProfileSkeleton";
import { ProfileTabNav } from "@/frontend/common/views/dashboard/profile/core/ProfileTabNav";
import { useAppTranslation } from "@/shared/locale";

export type ProfileShellProps = {
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
  readonly roleLabel?: string;
  readonly avatarUrl?: string | null;
};

export function ProfileShell({
  loading,
  error,
  actions,
  children,
  audience,
  scope,
  mode = ProfileMode.View,
  currentTab,
  onTabChange,
  onRetry,
  name,
  email,
  roleLabel,
  avatarUrl,
}: ProfileShellProps) {
  const t = useAppTranslation().profileTranslations.base;
  const showTabs = mode === ProfileMode.View && currentTab && onTabChange;

  function renderBody() {
    if (loading) {
      return <ProfileSkeleton />;
    }

    if (error) {
      return (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography sx={theme => ({ color: theme.palette.error.main })}>{error}</Typography>
          <Typography sx={{ mt: 2, color: theme => theme.palette.text.secondary }}>{t.shell.error.retry}</Typography>
          {onRetry ? (
            <Button variant="outlined" sx={{ mt: 2 }} onClick={onRetry}>
              {t.actions.retry}
            </Button>
          ) : null}
        </Box>
      );
    }

    return (
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
        <ProfileHeader
          name={name ?? ""}
          email={email ?? ""}
          roleLabel={roleLabel}
          avatarUrl={avatarUrl}
          actions={actions}
        />
        {showTabs ? (
          <ProfileTabNav
            audience={audience as ProfileAudience}
            scope={scope as ProfileScope}
            currentTab={currentTab}
            onTabChange={onTabChange}
          />
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
    );
  }

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
        {renderBody()}
      </Box>
    </PageContainer>
  );
}
