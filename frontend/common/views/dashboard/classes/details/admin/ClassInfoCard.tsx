"use client";

import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LanguageIcon from "@mui/icons-material/Language";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { BaseCard, UserAvatar } from "@/frontend/common/components/ui";
import type {
  ClassInstanceStudentInfo,
  ClassInstanceTeacherInfo,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import {
  StudentEntityLink,
  TeacherEntityLink,
} from "@/frontend/common/views/dashboard/classes/details/components/EntityLinks";
import { Link } from "@/shared/i18n/routing";

interface ClassInfoCardProps {
  readonly courseName: string;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly subjectAvatarUrl?: string | null;
  readonly student: ClassInstanceStudentInfo;
  readonly teacher: ClassInstanceTeacherInfo;
  readonly isActive: boolean;
  readonly labels: {
    readonly liveInstance: string;
    readonly activeConnection: string;
    readonly student: string;
    readonly moduleInstructor: string;
    readonly viewSubject: string;
  };
}

const StyledLiveInstanceChip = styled(Chip)(() => ({
  typography: "labelUppercase",
  opacity: 0.8,
}));

const StyledCourseNameHeading = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
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
  size = 64,
}: {
  readonly href?: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly size?: number;
}) {
  const avatar = <UserAvatar src={avatarUrl} label={name} size={size} />;

  if (!href) {
    return avatar;
  }

  return (
    <Box component={Link} href={href} sx={{ display: "inline-flex", textDecoration: "none", flexShrink: 0 }}>
      {avatar}
    </Box>
  );
}

function PersonBlock({
  href,
  name,
  avatarUrl,
  roleLabel,
  nameNode,
  detail,
}: {
  readonly href?: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly roleLabel: string;
  readonly nameNode: ReactNode;
  readonly detail?: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: { xs: 1.5, sm: 2 },
        flex: 1,
        minWidth: 0,
        width: "100%",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: { xs: 48, sm: 64 },
          height: { xs: 48, sm: 64 },
          "& .MuiAvatar-root": { width: "100%", height: "100%" },
        }}
      >
        <LinkedAvatar href={href} name={name} avatarUrl={avatarUrl} size={64} />
      </Box>
      <Box sx={{ minWidth: 0, overflow: "hidden" }}>
        <StyledPersonRoleCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
          {roleLabel}
        </StyledPersonRoleCaption>
        <Box
          sx={{
            minWidth: 0,
            "& a, & .MuiTypography-root": {
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          }}
        >
          {nameNode}
        </Box>
        {detail}
      </Box>
    </Stack>
  );
}

export function ClassInfoCard({
  courseName,
  subjectId,
  subjectName,
  subjectAvatarUrl,
  student,
  teacher,
  isActive,
  labels,
}: ClassInfoCardProps) {
  const studentProfileHref = student.id ? studentHref(student.id) : undefined;
  const teacherProfileHref = profileHrefForTeacher({ teacherId: teacher.id });
  const subjectHref = subjectId ? `/subjects/${subjectId}` : undefined;

  return (
    <BaseCard edgeToEdge sx={{ position: "relative", overflow: "hidden", height: "100%" }}>
      <Stack
        direction="row"
        sx={theme => ({
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: theme.spacing(4),
          gap: theme.spacing(1),
          flexWrap: "wrap",
        })}
      >
        <Stack
          direction="row"
          sx={theme => ({
            alignItems: "flex-start",
            gap: theme.spacing(2),
            flex: 1,
            minWidth: 0,
          })}
        >
          {subjectId || subjectName ? (
            <Box
              sx={{
                flexShrink: 0,
                width: { xs: 48, sm: 64 },
                height: { xs: 48, sm: 64 },
                "& .MuiAvatar-root": { width: "100%", height: "100%" },
              }}
            >
              <LinkedAvatar
                href={subjectHref}
                name={subjectName || courseName}
                avatarUrl={subjectAvatarUrl ?? undefined}
                size={64}
              />
            </Box>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
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
              sx={theme => ({
                mb: theme.spacing(0.5),
                color: theme.palette.primary.main,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              })}
            >
              {courseName}
            </StyledCourseNameHeading>
            {subjectName ? (
              <Typography
                variant="bodyMd"
                sx={theme => ({ mb: theme.spacing(0.5), color: theme.palette.text.secondary })}
              >
                {subjectName}
              </Typography>
            ) : null}
            {subjectId ? (
              <Button
                component={Link}
                href={`/subjects/${subjectId}`}
                variant="outlined"
                size="small"
                startIcon={<MenuBookOutlined />}
                sx={theme => ({ mt: theme.spacing(1.5) })}
              >
                {labels.viewSubject}
              </Button>
            ) : null}
          </Box>
        </Stack>
        {isActive && (
          <Stack
            direction="row"
            sx={theme => ({
              alignItems: "center",
              gap: theme.spacing(1),
              flexShrink: 0,
            })}
          >
            <StyledActiveStatusDot sx={theme => ({ color: theme.palette.status.active })} />
            <StyledActiveConnectionCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.activeConnection}
            </StyledActiveConnectionCaption>
          </Stack>
        )}
      </Stack>

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
          nameNode={
            student.id ? (
              <StudentEntityLink studentId={student.id} name={student.name ?? ""} variant="bodyLg" />
            ) : (
              <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
                {student.name ?? ""}
              </Typography>
            )
          }
        />

        <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
        <Divider sx={{ display: { xs: "block", sm: "none" } }} />

        <PersonBlock
          href={teacherProfileHref}
          name={teacher.name ?? ""}
          avatarUrl={teacher.avatarUrl ?? undefined}
          roleLabel={labels.moduleInstructor}
          nameNode={
            teacher.id ? (
              <TeacherEntityLink teacherId={teacher.id} name={teacher.name ?? ""} variant="bodyLg" />
            ) : (
              <Typography variant="bodyLg">{teacher.name ?? ""}</Typography>
            )
          }
          detail={
            teacher.title ? (
              <StyledPersonDetailCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
                {teacher.title}
              </StyledPersonDetailCaption>
            ) : null
          }
        />
      </Stack>

      <StyledDecorativeIconWrapper sx={theme => ({ color: theme.palette.primary.main })}>
        <LanguageIcon sx={{ fontSize: 200 }} />
      </StyledDecorativeIconWrapper>
    </BaseCard>
  );
}
