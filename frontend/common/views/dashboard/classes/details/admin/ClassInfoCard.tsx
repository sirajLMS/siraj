"use client";

import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LanguageIcon from "@mui/icons-material/Language";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { BaseCard, PersonProfileLink, StatusBadge } from "@/frontend/common/components/ui";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import type {
  ClassInstanceQuery_classInstance_student,
  ClassInstanceQuery_classInstance_teacher,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import { Link } from "@/shared/i18n";
import type { AdminViewLabels } from "@/shared/locale";

interface ClassInfoCardProps {
  readonly courseName: string;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly subjectAvatarUrl?: string | null;
  readonly student: NonNullable<ClassInstanceQuery_classInstance_student>;
  readonly teacher: NonNullable<ClassInstanceQuery_classInstance_teacher>;
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

const StyledCourseNameHeading = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledActiveStatusDot = styled(FiberManualRecordIcon)(({ theme }) => ({
  fontSize: theme.typography.labelMd.fontSize,
  color: theme.palette.status.active,
}));

const StyledActiveConnectionCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
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

function SubjectHeaderBlock({
  subjectId,
  subjectHref,
  subjectName,
  subjectAvatarUrl,
  courseName,
  isActive,
  labels,
}: {
  readonly subjectId: string;
  readonly subjectHref: string | undefined;
  readonly subjectName: string;
  readonly subjectAvatarUrl: string | undefined;
  readonly courseName: string;
  readonly isActive: boolean;
  readonly labels: ClassInfoCardProps["labels"]["classInfo"];
}) {
  const subjectAvatar = <UserAvatar src={subjectAvatarUrl} label={subjectName || courseName} size={64} />;

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
        <Box sx={{ flexShrink: 0 }}>
          {subjectHref ? (
            <Link href={subjectHref} style={{ textDecoration: "none" }}>
              {subjectAvatar}
            </Link>
          ) : (
            subjectAvatar
          )}
        </Box>
      ) : null}
      <Box sx={{ minWidth: 0 }}>
        {isActive ? (
          <Box sx={theme => ({ mb: theme.spacing(1.5) })}>
            <StatusBadge category="classInstance" status="ACTIVATED" label={labels.liveInstance} />
          </Box>
        ) : null}
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
          isActive={isActive}
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
