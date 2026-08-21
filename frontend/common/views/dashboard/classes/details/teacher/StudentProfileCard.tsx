"use client";

import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import type { ClassInstanceQuery_classInstance_student } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { StudentEntityLink } from "@/frontend/common/views/dashboard/classes/details/components/EntityLinks";
import {
  StyledTopAccentBar,
  StyledViewProfileButton,
  viewProfileButtonSx,
} from "@/frontend/common/views/dashboard/classes/details/teacher/profileCardShared";

interface StudentProfileCardProps {
  readonly student: ClassInstanceQuery_classInstance_student;
  readonly labels: {
    readonly viewFullProfile: string;
  };
}

export function StudentProfileCard({ student, labels }: StudentProfileCardProps) {
  if (!student.id) {
    return (
      <BaseCard edgeToEdge sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
        <StyledTopAccentBar />
        <Typography variant="titleLg">{student.name}</Typography>
      </BaseCard>
    );
  }

  const profileHref = studentHref(student.id);

  return (
    <BaseCard edgeToEdge sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
      <StyledTopAccentBar />
      <Box sx={{ mb: 3 }}>
        <StudentEntityLink
          studentId={student.id}
          name={student.name ?? ""}
          avatarUrl={student.avatarUrl ?? undefined}
          showAvatar
        />
      </Box>

      <StyledViewProfileButton href={profileHref} id="view-student-profile-btn" sx={viewProfileButtonSx}>
        {labels.viewFullProfile}
      </StyledViewProfileButton>
    </BaseCard>
  );
}
