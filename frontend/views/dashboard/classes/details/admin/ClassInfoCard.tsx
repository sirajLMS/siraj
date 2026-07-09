"use client";

import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LanguageIcon from "@mui/icons-material/Language";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard, UserAvatar } from "@/frontend/components/ui";
import type {
  ClassInstanceStudentInfo,
  ClassInstanceTeacherInfo,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher, studentHref } from "@/frontend/utils/profileHref";
import {
  StudentEntityLink,
  TeacherEntityLink,
} from "@/frontend/views/dashboard/classes/details/components/EntityLinks";
import { Link } from "@/shared/i18n/routing";

interface ClassInfoCardProps {
  readonly courseName: string;
  readonly instanceId: string;
  readonly student: ClassInstanceStudentInfo;
  readonly teacher: ClassInstanceTeacherInfo;
  readonly isActive: boolean;
  readonly labels: {
    readonly liveInstance: string;
    readonly activeConnection: string;
    readonly student: string;
    readonly moduleInstructor: string;
  };
}

const StyledLiveInstanceChip = styled(Chip)(() => ({
  typography: "labelUppercase",
  opacity: 0.8,
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

const StyledPersonRoleCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  display: "block",
}));

const StyledPersonDetailCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  display: "block",
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
}: {
  readonly href?: string;
  readonly name: string;
  readonly avatarUrl?: string;
}) {
  const avatar = <UserAvatar src={avatarUrl} label={name} size={64} />;

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
  const studentProfileHref = student.id ? studentHref(student.id) : undefined;
  const teacherProfileHref = profileHrefForTeacher({ teacherId: teacher.id });

  return (
    <BaseCard edgeToEdge sx={{ position: "relative", overflow: "hidden", height: "100%" }}>
      <Stack
        direction="row"
        sx={theme => ({ justifyContent: "space-between", alignItems: "flex-start", mb: theme.spacing(4) })}
      >
        <Box>
          <StyledLiveInstanceChip
            label={labels.liveInstance}
            size="small"
            sx={theme => ({
              mb: theme.spacing(1.5),
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
              "& .MuiChip-label": {
                paddingInline: theme.spacing(1.5),
              },
            })}
          />
          <StyledCourseNameHeading
            variant="h3"
            sx={theme => ({ mb: theme.spacing(0.5), color: theme.palette.primary.main })}
          >
            {courseName}
          </StyledCourseNameHeading>
          <StyledInstanceIdLabel variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
            Instance ID:{" "}
            <Box
              component="span"
              sx={theme => ({
                fontFamily: "monospace",
                fontWeight: theme.typography.fontWeightBold,
                color: theme.palette.primary.main,
              })}
            >
              {instanceId}
            </Box>
          </StyledInstanceIdLabel>
        </Box>
        {isActive && (
          <Stack direction="row" sx={theme => ({ alignItems: "center", gap: theme.spacing(1) })}>
            <StyledActiveStatusDot sx={theme => ({ color: theme.palette.status.active })} />
            <StyledActiveConnectionCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.activeConnection}
            </StyledActiveConnectionCaption>
          </Stack>
        )}
      </Stack>

      <Stack direction="row" sx={theme => ({ gap: theme.spacing(4), mt: theme.spacing(2), alignItems: "center" })}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 2, flex: 1 }}>
          <LinkedAvatar
            href={studentProfileHref}
            name={student.name ?? ""}
            avatarUrl={student.avatarUrl ?? undefined}
          />
          <Box>
            <StyledPersonRoleCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.student}
            </StyledPersonRoleCaption>
            {student.id ? (
              <StudentEntityLink studentId={student.id} name={student.name ?? ""} />
            ) : (
              <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                {student.name ?? ""}
              </Typography>
            )}
            {student.id ? (
              <StyledPersonDetailCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
                ID: {student.id}
              </StyledPersonDetailCaption>
            ) : null}
          </Box>
        </Stack>

        <Divider orientation="vertical" flexItem />

        <Stack direction="row" sx={{ alignItems: "center", gap: 2, flex: 1 }}>
          <LinkedAvatar
            href={teacherProfileHref}
            name={teacher.name ?? ""}
            avatarUrl={teacher.avatarUrl ?? undefined}
          />
          <Box>
            <StyledPersonRoleCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.moduleInstructor}
            </StyledPersonRoleCaption>
            {teacher.id ? (
              <TeacherEntityLink teacherId={teacher.id} name={teacher.name ?? ""} />
            ) : (
              <Typography variant="titleLg">{teacher.name ?? ""}</Typography>
            )}
            {teacher.title ? (
              <StyledPersonDetailCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
                {teacher.title}
              </StyledPersonDetailCaption>
            ) : null}
          </Box>
        </Stack>
      </Stack>

      <StyledDecorativeIconWrapper sx={theme => ({ color: theme.palette.primary.main })}>
        <LanguageIcon sx={{ fontSize: 200 }} />
      </StyledDecorativeIconWrapper>
    </BaseCard>
  );
}
