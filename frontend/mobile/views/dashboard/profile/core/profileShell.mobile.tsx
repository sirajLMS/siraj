"use client";

import { Box, Button, Skeleton, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { ProfileAvatarView } from "@/frontend/common/components/ui/input/avatarImageField";
import { ProfileMode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileHeader } from "@/frontend/common/views/dashboard/profile/core/ProfileHeader";
import { ProfileSkeleton } from "@/frontend/common/views/dashboard/profile/core/ProfileSkeleton";
import { ProfileTabNav } from "@/frontend/common/views/dashboard/profile/core/ProfileTabNav";
import type { ProfileShellProps } from "@/frontend/common/views/dashboard/profile/core/profileShellTypes";
import type { ProfileShellViewModel } from "@/frontend/common/views/dashboard/profile/core/types/profileShell.types";
import { MobilePageContainer } from "@/frontend/mobile/components/ui";
import type { ProfileLabels } from "@/shared/locale/types/profile";

export type ProfileShellMobileViewProps = ProfileShellViewModel;

function renderBody(
  {
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
  }: Readonly<ProfileShellProps>,
  t: ProfileLabels
): ReactNode {
  const showTabs = mode === ProfileMode.View && currentTab && onTabChange;
  const isEditMode = mode === ProfileMode.Edit;

  if (loading) {
    return isEditMode ? (
      <Box sx={{ width: "100%", py: 2 }}>
        <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 1 }} />
      </Box>
    ) : (
      <ProfileSkeleton />
    );
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
      {(() => {
        if (isEditMode) {
          return actions ? (
            <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>{actions}</Box>
          ) : null;
        }
        return (
          <>
            <ProfileAvatarView imageUrl={avatarUrl} label={name ?? t.avatar} title={name ?? t.avatar} />
            <ProfileHeader
              name={name ?? ""}
              email={email ?? ""}
              roleLabel={roleLabel}
              avatarUrl={avatarUrl}
              showAvatar={false}
              actions={actions}
            />
          </>
        );
      })()}
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
  );
}

export function ProfileShellMobileView({ labels, ...shellProps }: Readonly<ProfileShellMobileViewProps>) {
  const props: ProfileShellProps = shellProps;
  return (
    <MobilePageContainer sx={{ px: { xs: 2 } }}>
      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          gap: theme.layout.sectionGap,
          width: "100%",
        })}
      >
        {renderBody(props, labels)}
      </Box>
    </MobilePageContainer>
  );
}
