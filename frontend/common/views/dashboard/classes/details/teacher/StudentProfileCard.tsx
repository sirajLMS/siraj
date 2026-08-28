"use client";

import { Box, Typography } from "@mui/material";
import type { ClassInstanceQuery_classInstance_student } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { StudentEntityLink } from "@/frontend/common/views/dashboard/classes/details/components/EntityLinks";
import { ProfileCardShared } from "@/frontend/common/views/dashboard/classes/details/teacher/profileCardShared";

interface StudentProfileCardProps {
  readonly student: ClassInstanceQuery_classInstance_student;
  readonly labels: {
    readonly viewFullProfile: string;
  };
}

export function StudentProfileCard({ student, labels }: StudentProfileCardProps) {
  if (!student.id) {
    return (
      <ProfileCardShared
        content={<Typography variant="titleLg">{student.name}</Typography>}
        profileHref={undefined}
        buttonId="view-student-profile-btn"
        viewFullProfileLabel={labels.viewFullProfile}
      />
    );
  }

  return (
    <ProfileCardShared
      content={
        <Box sx={{ mb: 3 }}>
          <StudentEntityLink
            studentId={student.id}
            name={student.name ?? ""}
            avatarUrl={student.avatarUrl ?? undefined}
            showAvatar
          />
        </Box>
      }
      profileHref={studentHref(student.id)}
      buttonId="view-student-profile-btn"
      viewFullProfileLabel={labels.viewFullProfile}
    />
  );
}
