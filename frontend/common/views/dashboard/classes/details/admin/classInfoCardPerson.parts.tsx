"use client";

import { Box, Divider, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { PersonProfileLink } from "@/frontend/common/components/ui";
import type {
  ClassInfoCardLabels,
  ClassInfoStudent,
  ClassInfoTeacher,
} from "@/frontend/common/views/dashboard/classes/details/admin/classInfoCard.helpers";
import { StyledPersonDetailCaption } from "@/frontend/common/views/dashboard/classes/details/admin/classInfoCard.styled";

interface PersonBlockProps {
  readonly href?: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly roleLabel: string;
  readonly detail?: ReactNode;
}

function PersonBlock({ href, name, avatarUrl, roleLabel, detail }: PersonBlockProps) {
  return (
    <Box sx={theme => ({ flex: 1, minWidth: 0, width: "100%", mt: theme.spacing(0.5) })}>
      <PersonProfileLink
        href={href}
        name={name}
        avatarUrl={avatarUrl}
        avatarSize={64}
        label={roleLabel}
        typographyVariant="bodyLg"
        fontWeight={600}
      />
      {detail}
    </Box>
  );
}

interface PersonRowProps {
  readonly studentProfileHref: string | undefined;
  readonly teacherProfileHref: string | undefined;
  readonly student: ClassInfoStudent;
  readonly teacher: ClassInfoTeacher;
  readonly labels: ClassInfoCardLabels;
}

export function PersonRow({ studentProfileHref, teacherProfileHref, student, teacher, labels }: PersonRowProps) {
  const teacherDetail = teacher.title ? (
    <StyledPersonDetailCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
      {teacher.title}
    </StyledPersonDetailCaption>
  ) : null;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      sx={theme => ({
        gap: { xs: theme.spacing(2), sm: theme.spacing(4) },
        mt: theme.spacing(2),
        alignItems: { xs: "stretch", sm: "center" },
        minWidth: 0,
      })}
    >
      <PersonBlock
        href={studentProfileHref}
        name={student.name ?? ""}
        avatarUrl={student.avatarUrl ?? undefined}
        roleLabel={labels.student}
      />

      <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
      <Divider sx={{ display: { xs: "block", sm: "none" } }} />

      <PersonBlock
        href={teacherProfileHref}
        name={teacher.name ?? ""}
        avatarUrl={teacher.avatarUrl ?? undefined}
        roleLabel={labels.moduleInstructor}
        detail={teacherDetail}
      />
    </Stack>
  );
}
