"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { ProfileAvatarView } from "@/frontend/common/components/ui/input/avatarImageField";
import { ProfileShellShared } from "@/frontend/common/views/dashboard/profile/core/__shared__/profileShellShared";
import { ProfileHeader } from "@/frontend/common/views/dashboard/profile/core/ProfileHeader";
import type { ProfileShellProps } from "@/frontend/common/views/dashboard/profile/core/profileShellTypes";
import type { ProfileShellViewModel } from "@/frontend/common/views/dashboard/profile/core/types/profileShell.types";
import { MobilePageContainer } from "@/frontend/mobile/components/ui";
import { ProfileMode } from "@/shared/constants/profile.enum";
import type { ProfileLabels } from "@/shared/locale/types/profile";

export type ProfileShellMobileViewProps = ProfileShellViewModel;

function renderMobileHeader(props: Readonly<ProfileShellProps>, t: ProfileLabels): ReactNode {
  const { mode, actions, name, email, roleLabel, avatarUrl } = props;
  if (mode === ProfileMode.EDIT) {
    if (actions) {
      return <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>{actions}</Box>;
    }
    return null;
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
}

export function ProfileShellMobileView({ labels, ...shellProps }: Readonly<ProfileShellMobileViewProps>) {
  return (
    <MobilePageContainer>
      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          gap: theme.layout.sectionGap,
          width: "100%",
        })}
      >
        <ProfileShellShared shellProps={shellProps} labels={labels} options={{ renderHeader: renderMobileHeader }} />
      </Box>
    </MobilePageContainer>
  );
}
