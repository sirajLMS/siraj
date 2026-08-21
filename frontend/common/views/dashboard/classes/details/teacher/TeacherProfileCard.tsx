"use client";

import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import type { ClassInstanceQuery_classInstance_teacher } from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { TeacherEntityLink } from "@/frontend/common/views/dashboard/classes/details/components/EntityLinks";
import {
  StyledTopAccentBar,
  StyledViewProfileButton,
  viewProfileButtonSx,
} from "@/frontend/common/views/dashboard/classes/details/teacher/profileCardShared";

interface TeacherProfileCardProps {
  readonly teacher: ClassInstanceQuery_classInstance_teacher;
  readonly labels: {
    readonly viewFullProfile: string;
  };
}

export function TeacherProfileCard({ teacher, labels }: TeacherProfileCardProps) {
  if (!teacher.id) {
    return (
      <BaseCard edgeToEdge sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
        <StyledTopAccentBar />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
          {teacher.name}
        </Typography>
      </BaseCard>
    );
  }

  const profileHref = profileHrefForTeacher({ teacherId: teacher.id });

  return (
    <BaseCard edgeToEdge sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
      <StyledTopAccentBar />
      <Box sx={{ mb: 3 }}>
        <TeacherEntityLink
          teacherId={teacher.id}
          name={teacher.name ?? ""}
          avatarUrl={teacher.avatarUrl ?? undefined}
          showAvatar
        />
      </Box>

      {profileHref ? (
        <StyledViewProfileButton href={profileHref} id="view-teacher-profile-btn" sx={viewProfileButtonSx}>
          {labels.viewFullProfile}
        </StyledViewProfileButton>
      ) : null}
    </BaseCard>
  );
}
