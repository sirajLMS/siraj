"use client";

import { Divider, Stack, Typography } from "@mui/material";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import type { StudentProfileSectionLabels } from "@/frontend/common/views/dashboard/student/profile/sections/studentProfileSection.types";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";

type StudentProfileIdentityHeaderProps = {
  readonly profile: StudentProfileRow;
  readonly labels: StudentProfileSectionLabels;
  readonly showAvatar?: boolean;
  readonly showEmail?: boolean;
};

export function StudentProfileIdentityHeader({
  profile,
  labels,
  showAvatar = true,
  showEmail = true,
}: Readonly<StudentProfileIdentityHeaderProps>) {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        {showAvatar ? <UserAvatar src={profile.avatarUrl} label={profile.name} size={80} /> : null}
        <Stack>
          <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
            {profile.name}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {profile.status}
          </Typography>
        </Stack>
      </Stack>
      {showEmail ? (
        <>
          <Divider />
          <Stack spacing={0.5}>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.email}
            </Typography>
            <Typography variant="bodyMd">{profile.email ?? "—"}</Typography>
          </Stack>
        </>
      ) : null}
    </Stack>
  );
}
