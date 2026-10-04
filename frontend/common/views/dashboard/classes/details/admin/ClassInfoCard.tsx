"use client";

import LanguageIcon from "@mui/icons-material/Language";
import { Box, Stack, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import {
  type ClassInfoCardLabels,
  type ClassInfoRateLabels,
  type ClassInfoStudent,
  type ClassInfoTeacher,
  getRateSourceLabel,
} from "@/frontend/common/views/dashboard/classes/details/admin/classInfoCard.helpers";
import { StyledDecorativeIconWrapper } from "@/frontend/common/views/dashboard/classes/details/admin/classInfoCard.styled";
import { PersonRow } from "@/frontend/common/views/dashboard/classes/details/admin/classInfoCardPerson.parts";
import {
  ActiveConnectionIndicator,
  SubjectHeaderBlock,
} from "@/frontend/common/views/dashboard/classes/details/admin/classInfoCardSubject.parts";

interface ClassInfoCardProps {
  readonly courseName: string;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly subjectAvatarUrl?: string | null;
  readonly student: ClassInfoStudent;
  readonly teacher: ClassInfoTeacher;
  readonly isActive: boolean;
  readonly rateAmount: string | null;
  readonly rateCurrency: string | null;
  readonly rateSource: string | null;
  readonly isRateOverridden: boolean;
  readonly labels: {
    readonly classInfo: ClassInfoCardLabels;
    readonly rate: ClassInfoRateLabels;
  };
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
