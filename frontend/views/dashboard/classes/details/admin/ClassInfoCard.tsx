"use client";

import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LanguageIcon from "@mui/icons-material/Language";
import { Avatar, Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import { avatarInitials } from "@/frontend/utils/avatar";
import type { StudentInfo, TeacherInfo } from "@/frontend/views/dashboard/types/dashboard";
import { Link } from "@/shared/i18n/routing";
import { StudentEntityLink, TeacherEntityLink } from "../components/EntityLinks";

interface ClassInfoCardProps {
  readonly courseName: string;
  readonly instanceId: string;
  readonly student: StudentInfo;
  readonly teacher: TeacherInfo;
  readonly isActive: boolean;
  readonly labels: {
    readonly liveInstance: string;
    readonly activeConnection: string;
    readonly student: string;
    readonly moduleInstructor: string;
  };
}

const StyledLiveInstanceChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  typography: "labelUppercase",
  opacity: 0.8,
  "& .MuiChip-label": {
    paddingInline: theme.spacing(1.5),
  },
}));

const StyledCourseNameHeading = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledInstanceIdLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledActiveStatusDot = styled(FiberManualRecordIcon)(({ theme }) => ({
  fontSize: 12,
  color: theme.palette.status.active,
}));

const StyledActiveConnectionCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
}));

const StyledStudentAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.primary.main,
}));

const StyledTeacherAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
}));

const StyledPersonRoleCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  display: "block",
}));

const StyledPersonDetailCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledDecorativeIconWrapper = styled(Box)(({ theme }) => ({
  position: "absolute",
  right: -16,
  bottom: -16,
  opacity: 0.03,
  pointerEvents: "none",
  color: theme.palette.primary.main,
}));

function LinkedAvatar({
  href,
  name,
  avatarUrl,
  variant,
}: {
  readonly href?: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly variant: "student" | "teacher";
}) {
  const avatar =
    variant === "student" ? (
      <StyledStudentAvatar src={avatarUrl} alt={name}>
        {avatarInitials(name)}
      </StyledStudentAvatar>
    ) : (
      <StyledTeacherAvatar alt={name} src={avatarUrl}>
        {avatarInitials(name)}
      </StyledTeacherAvatar>
    );

  if (!href) {
    return avatar;
  }

  return (
    <Box component={Link} href={href} sx={{ display: "inline-flex", textDecoration: "none" }}>
      {avatar}
    </Box>
  );
}

export function ClassInfoCard({ courseName, instanceId, student, teacher, isActive, labels }: ClassInfoCardProps) {
  const studentHref = student.id ? `/students/${student.id}` : undefined;
  const teacherHref = teacher.id ? `/teachers/${teacher.id}/profile` : undefined;

  return (
    <BaseCard sx={{ position: "relative", overflow: "hidden", height: "100%" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <StyledLiveInstanceChip label={labels.liveInstance} size="small" sx={{ mb: 1.5 }} />
          <StyledCourseNameHeading variant="h3" sx={{ mb: 0.5 }}>
            {courseName}
          </StyledCourseNameHeading>
          <StyledInstanceIdLabel variant="body2">
            Instance ID:{" "}
            <Box
              component="span"
              sx={theme => ({
                fontFamily: "monospace",
                fontWeight: 700,
                color: theme.palette.primary.main,
              })}
            >
              {instanceId}
            </Box>
          </StyledInstanceIdLabel>
        </Box>
        {isActive && (
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <StyledActiveStatusDot />
            <StyledActiveConnectionCaption variant="caption">{labels.activeConnection}</StyledActiveConnectionCaption>
          </Stack>
        )}
      </Stack>

      <Stack direction="row" sx={{ gap: 4, mt: 2 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 2, flex: 1 }}>
          <LinkedAvatar href={studentHref} name={student.name} avatarUrl={student.avatarUrl} variant="student" />
          <Box>
            <StyledPersonRoleCaption variant="caption">{labels.student}</StyledPersonRoleCaption>
            {student.id ? (
              <StudentEntityLink studentId={student.id} name={student.name} />
            ) : (
              <Typography variant="titleLg">{student.name}</Typography>
            )}
            <StyledPersonDetailCaption variant="caption">ID: {student.id}</StyledPersonDetailCaption>
          </Box>
        </Stack>

        <Divider orientation="vertical" flexItem />

        <Stack direction="row" sx={{ alignItems: "center", gap: 2, flex: 1 }}>
          <LinkedAvatar href={teacherHref} name={teacher.name} avatarUrl={teacher.avatarUrl} variant="teacher" />
          <Box>
            <StyledPersonRoleCaption variant="caption">{labels.moduleInstructor}</StyledPersonRoleCaption>
            {teacher.id ? (
              <TeacherEntityLink teacherId={teacher.id} name={teacher.name} />
            ) : (
              <Typography variant="titleLg">{teacher.name}</Typography>
            )}
            {teacher.title ? (
              <StyledPersonDetailCaption variant="caption">{teacher.title}</StyledPersonDetailCaption>
            ) : null}
          </Box>
        </Stack>
      </Stack>

      <StyledDecorativeIconWrapper>
        <LanguageIcon sx={{ fontSize: 200 }} />
      </StyledDecorativeIconWrapper>
    </BaseCard>
  );
}
