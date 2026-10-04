"use client";

import { Box, ButtonBase, Typography } from "@mui/material";
import type React from "react";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import type { SimulationStatus } from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.types";
import { Translation, useAppTranslation } from "@/shared/locale";

function DualAvatarTrigger({
  primaryAvatarUrl,
  primaryName,
  secondaryAvatarUrl,
  secondaryName,
}: Readonly<{
  primaryAvatarUrl: string;
  primaryName: string;
  secondaryAvatarUrl?: string;
  secondaryName?: string;
}>) {
  return (
    <Box sx={{ position: "relative", width: { xs: 40, md: 48 }, height: { xs: 32, md: 40 } }}>
      <UserAvatar
        src={primaryAvatarUrl}
        label={primaryName}
        size={34}
        sx={{
          width: { xs: 28, md: 34 },
          height: { xs: 28, md: 34 },
          position: "absolute",
          left: 0,
          bottom: 0,
          border: theme => `2px solid ${theme.palette.headerContainer}`,
        }}
      />
      <UserAvatar
        src={secondaryAvatarUrl}
        label={secondaryName ?? ""}
        size={28}
        sx={{
          width: { xs: 24, md: 28 },
          height: { xs: 24, md: 28 },
          position: "absolute",
          right: 0,
          top: 0,
          border: theme => `2px solid ${theme.palette.headerContainer}`,
        }}
      />
    </Box>
  );
}

export function UserMenuTrigger({
  userName,
  avatarUrl,
  displayName,
  isImpersonating,
  isSimulatingGroup,
  simulationStatus,
  actorUserName,
  open,
  onClick,
}: Readonly<{
  userName: string;
  avatarUrl: string;
  displayName: string;
  isImpersonating: boolean;
  isSimulatingGroup: boolean;
  simulationStatus: SimulationStatus;
  actorUserName?: string;
  open: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}>) {
  const tCommon = useAppTranslation(Translation.Common);
  return (
    <ButtonBase
      onClick={onClick}
      sx={theme => ({
        borderRadius: isImpersonating || isSimulatingGroup ? 2 : "50%",
        padding: 0.5,
        border: isImpersonating || isSimulatingGroup ? "none" : `2px solid ${theme.palette.onHeaderContainer}`,
        transition: theme.transitions.create("all", { duration: 200, easing: theme.transitions.easing.easeInOut }),
        display: "flex",
        alignItems: "center",
        gap: 1,
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: theme.palette.shadow.cardHover,
        },
      })}
      aria-label={tCommon.ariaUserProfileMenu}
      aria-controls={open ? "user-profile-menu" : undefined}
      aria-haspopup="true"
      aria-expanded={open ? "true" : undefined}
    >
      {isSimulatingGroup && simulationStatus?.groupName ? (
        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            flexDirection: "column",
            alignItems: "flex-end",
            minWidth: 0,
            maxWidth: 120,
          }}
        >
          <Typography variant="labelMd" noWrap sx={{ fontWeight: 500, lineHeight: 1.2 }}>
            {userName}
          </Typography>
          <Typography variant="labelSm" noWrap sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {simulationStatus.groupName}
          </Typography>
        </Box>
      ) : null}
      {isImpersonating ? (
        <DualAvatarTrigger
          primaryAvatarUrl={avatarUrl}
          primaryName={displayName}
          secondaryAvatarUrl={avatarUrl}
          secondaryName={actorUserName ?? undefined}
        />
      ) : (
        <UserAvatar
          src={avatarUrl}
          label={userName}
          size={40}
          sx={{
            width: { xs: 32, md: 40 },
            height: { xs: 32, md: 40 },
          }}
        />
      )}
    </ButtonBase>
  );
}
