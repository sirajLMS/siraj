"use client";

import { Box, Typography } from "@mui/material";
import type { ClassInstanceQuery_classInstance_teacher } from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { TeacherEntityLink } from "@/frontend/common/views/dashboard/classes/details/components/EntityLinks";
import { ProfileCardShared } from "@/frontend/common/views/dashboard/classes/details/teacher/profileCardShared";

interface TeacherProfileCardProps {
  readonly teacher: ClassInstanceQuery_classInstance_teacher;
  readonly labels: {
    readonly viewFullProfile: string;
  };
}

export function TeacherProfileCard({ teacher, labels }: TeacherProfileCardProps) {
  if (!teacher.id) {
    return (
      <ProfileCardShared
        content={
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
            {teacher.name}
          </Typography>
        }
        profileHref={undefined}
        buttonId="view-teacher-profile-btn"
        viewFullProfileLabel={labels.viewFullProfile}
      />
    );
  }

  return (
    <ProfileCardShared
      content={
        <Box sx={{ mb: 3 }}>
          <TeacherEntityLink
            teacherId={teacher.id}
            name={teacher.name ?? ""}
            avatarUrl={teacher.avatarUrl ?? undefined}
            showAvatar
          />
        </Box>
      }
      profileHref={profileHrefForTeacher({ teacherId: teacher.id })}
      buttonId="view-teacher-profile-btn"
      viewFullProfileLabel={labels.viewFullProfile}
    />
  );
}
