"use client";

import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LanguageIcon from "@mui/icons-material/Language";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { BaseCard } from "@/frontend/common/components/ui";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import type {
  ClassInstanceStudentInfo,
  ClassInstanceTeacherInfo,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import {
  StudentEntityLink,
  TeacherEntityLink,
} from "@/frontend/common/views/dashboard/classes/details/components/EntityLinks";
import { Link } from "@/shared/i18n";
import type { AdminViewLabels } from "@/shared/locale";

interface ClassInfoCardProps {
  readonly courseName: string;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly subjectAvatarUrl?: string | null;
  readonly student: ClassInstanceStudentInfo;
  readonly teacher: ClassInstanceTeacherInfo;
  readonly isActive: boolean;
  readonly rateAmount: string | null;
  readonly rateCurrency: string | null;
  readonly rateSource: string | null;
  readonly isRateOverridden: boolean;
  readonly labels: {
    readonly classInfo: AdminViewLabels["classInfo"];
    readonly rate: AdminViewLabels["rate"];
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

  // Prefer a positive condition for readability and to satisfy static analysis rules.
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <Box sx={{ display: "inline-flex", flexShrink: 0 }}>{avatar}</Box>
      </Link>
    );
  }

  return avatar;
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

function SubjectHeaderBlock({
  subjectId,
  subjectHref,
  subjectName,
  subjectAvatarUrl,
  courseName,
  labels,
}: {
  readonly subjectId: string;
  readonly subjectHref: string | undefined;
  readonly subjectName: string;
  readonly subjectAvatarUrl: string | undefined;
  readonly courseName: string;
  readonly labels: ClassInfoCardProps["labels"]["classInfo"];
}) {
  return (
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
          <LinkedAvatar href={subjectHref} name={subjectName || courseName} avatarUrl={subjectAvatarUrl} size={64} />
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
          <Typography variant="bodyMd" sx={theme => ({ mb: theme.spacing(0.5), color: theme.palette.text.secondary })}>
            {subjectName}
          </Typography>
        ) : null}
        {subjectId ? (
          <Link href={`/subjects/${subjectId}`} style={{ textDecoration: "none" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MenuBookOutlined />}
              sx={theme => ({ mt: theme.spacing(1.5) })}
            >
              {labels.viewSubject}
            </Button>
          </Link>
        ) : null}
      </Box>
    </Stack>
  );
}

function ActiveConnectionIndicator({ activeConnection }: { readonly activeConnection: string }) {
  return (
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
        {activeConnection}
      </StyledActiveConnectionCaption>
    </Stack>
  );
}

function PersonRow({
  studentProfileHref,
  teacherProfileHref,
  student,
  teacher,
  labels,
}: {
  readonly studentProfileHref: string | undefined;
  readonly teacherProfileHref: string | undefined;
  readonly student: ClassInfoCardProps["student"];
  readonly teacher: ClassInfoCardProps["teacher"];
  readonly labels: ClassInfoCardProps["labels"]["classInfo"];
}) {
  // Extract nodes before returning JSX to avoid nested/inline ternaries and improve readability.
  const studentNameNode = student.id ? (
    <StudentEntityLink studentId={student.id} name={student.name ?? ""} variant="bodyLg" />
  ) : (
    <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
      {student.name ?? ""}
    </Typography>
  );

  const teacherNameNode = teacher.id ? (
    <TeacherEntityLink teacherId={teacher.id} name={teacher.name ?? ""} variant="bodyLg" />
  ) : (
    <Typography variant="bodyLg">{teacher.name ?? ""}</Typography>
  );

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
        nameNode={studentNameNode}
      />

      <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
      <Divider sx={{ display: { xs: "block", sm: "none" } }} />

      <PersonBlock
        href={teacherProfileHref}
        name={teacher.name ?? ""}
        avatarUrl={teacher.avatarUrl ?? undefined}
        roleLabel={labels.moduleInstructor}
        nameNode={teacherNameNode}
        detail={teacherDetail}
      />
    </Stack>
  );
}

function getRateSourceLabel(
  isRateOverridden: boolean,
  rateSource: string | null,
  rateLabels: ClassInfoCardProps["labels"]["rate"]
): string {
  if (isRateOverridden) {
    return rateLabels.rateSourceOverride;
  }
  switch (rateSource) {
    case "RECURRING":
      return rateLabels.rateSourceRecurring;
    case "SUBJECT":
      return rateLabels.rateSourceSubject;
    case "TEACHER":
      return rateLabels.rateSourceTeacher;
    default:
      return rateLabels.rateSourceTeacher;
  }
}

export function ClassInfoCard({
  courseName,
  subjectId,
  subjectName,
  subjectAvatarUrl,
  student,
  teacher,
  isActive,
  rateAmount,
  rateCurrency,
  rateSource,
  isRateOverridden,
  labels,
}: ClassInfoCardProps) {
  const studentProfileHref = student.id ? studentHref(student.id) : undefined;
  const teacherProfileHref = profileHrefForTeacher({ teacherId: teacher.id });
  const subjectHref = subjectId ? `/subjects/${subjectId}` : undefined;
  const rateSourceLabel = getRateSourceLabel(isRateOverridden, rateSource, labels.rate);

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
        <SubjectHeaderBlock
          subjectId={subjectId}
          subjectHref={subjectHref}
          subjectName={subjectName}
          subjectAvatarUrl={subjectAvatarUrl ?? undefined}
          courseName={courseName}
          labels={labels.classInfo}
        />
        {isActive && <ActiveConnectionIndicator activeConnection={labels.classInfo.activeConnection} />}
      </Stack>

      <PersonRow
        studentProfileHref={studentProfileHref}
        teacherProfileHref={teacherProfileHref}
        student={student}
        teacher={teacher}
        labels={labels.classInfo}
      />

      {rateAmount !== null ? (
        <Stack sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: theme => theme.palette.border.light }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.header, mb: 2 })}>
            {labels.rate.rateSectionTitle}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 3 }}>
            <Box sx={{ flex: "1 1 200px" }}>
              <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.header, mb: 0.5 })}>
                {labels.rate.effectiveRateLabel}
              </Typography>
              <Typography variant="bodyLg" sx={theme => ({ fontWeight: theme.typography.fontWeightBold })}>
                {rateCurrency ?? ""} {rateAmount}
              </Typography>
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
              <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.header, mb: 0.5 })}>
                {labels.rate.rateSourceLabel}
              </Typography>
              <Typography variant="bodyLg">{rateSourceLabel}</Typography>
            </Box>
          </Stack>
        </Stack>
      ) : null}

      <StyledDecorativeIconWrapper sx={theme => ({ color: theme.palette.primary.main })}>
        <LanguageIcon sx={{ fontSize: 200 }} />
      </StyledDecorativeIconWrapper>
    </BaseCard>
  );
}
