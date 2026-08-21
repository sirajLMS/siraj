"use client";

import { Box, Button, Skeleton, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { ProfileSkeleton } from "@/frontend/common/views/dashboard/profile/core/ProfileSkeleton";
import { ProfileTabNav } from "@/frontend/common/views/dashboard/profile/core/ProfileTabNav";
import type { ProfileShellProps } from "@/frontend/common/views/dashboard/profile/core/profileShellTypes";
import { ProfileMode } from "@/shared/constants/profile.enum";
import type { ProfileLabels } from "@/shared/locale/types/profile";

export interface ProfileShellSharedOptions {
  readonly renderHeader: (props: Readonly<ProfileShellProps>, t: ProfileLabels) => ReactNode;
}

export function ProfileShellShared({
  shellProps,
  labels,
  options,
}: Readonly<{
  readonly shellProps: ProfileShellProps;
  readonly labels: ProfileLabels;
  readonly options: ProfileShellSharedOptions;
}>) {
  const {
    loading,
    error,
    children,
    audience,
    scope,
    mode = ProfileMode.VIEW,
    currentTab,
    onTabChange,
    onRetry,
  } = shellProps;
  const showTabs = mode === ProfileMode.VIEW && currentTab && onTabChange;
  const isEditMode = mode === ProfileMode.EDIT;

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
        <Typography sx={{ mt: 2, color: theme => theme.palette.text.secondary }}>{labels.shell.error.retry}</Typography>
        {onRetry ? (
          <Button variant="outlined" sx={{ mt: 2 }} onClick={onRetry}>
            {labels.actions.retry}
          </Button>
        ) : null}
      </Box>
    );
  }

  const contentKey = currentTab ?? "content";
  const tabAnimation = showTabs ? "profileTabFade 0.2s ease-out" : undefined;

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
      {options.renderHeader(shellProps, labels)}
      {showTabs ? (
        <ProfileTabNav audience={audience} scope={scope} currentTab={currentTab} onTabChange={onTabChange} />
      ) : null}
      <Box
        key={contentKey}
        sx={{
          animation: tabAnimation,
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
