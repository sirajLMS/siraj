"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { ProfileMode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileShellShared } from "@/frontend/common/views/dashboard/profile/core/__shared__/profileShellShared";
import { ProfileHeader } from "@/frontend/common/views/dashboard/profile/core/ProfileHeader";
import type { ProfileShellProps } from "@/frontend/common/views/dashboard/profile/core/profileShellTypes";
import type { ProfileShellViewModel } from "@/frontend/common/views/dashboard/profile/core/types/profileShell.types";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui";

export type ProfileShellDesktopViewProps = ProfileShellViewModel;

function renderDesktopHeader(props: Readonly<ProfileShellProps>): ReactNode {
  const { mode, actions, name, email, roleLabel, avatarUrl } = props;
  if (mode === ProfileMode.Edit) {
    if (actions) {
      return <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>{actions}</Box>;
    }
    return null;
  }
  return (
    <ProfileHeader
      name={name ?? ""}
      email={email ?? ""}
      roleLabel={roleLabel}
      avatarUrl={avatarUrl}
      actions={actions}
    />
  );
}

export function ProfileShellDesktopView({ labels, ...shellProps }: Readonly<ProfileShellDesktopViewProps>) {
  return (
    <DesktopPageContainer sx={{ px: 0 }}>
      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          gap: theme.layout.sectionGap,
          width: "100%",
        })}
      >
        <ProfileShellShared shellProps={shellProps} labels={labels} options={{ renderHeader: renderDesktopHeader }} />
      </Box>
    </DesktopPageContainer>
  );
}
