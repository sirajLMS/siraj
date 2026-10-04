"use client";

import { Box } from "@mui/material";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import {
  ClassesLeftField,
  TeacherField,
  TotalClassesField,
} from "@/frontend/common/views/dashboard/students/quota/components/courseDetailsSectionShared.parts";
import type { CourseDetailsSectionSharedProps } from "@/frontend/common/views/dashboard/students/quota/components/courseDetailsSectionShared.types";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/useQuotaFormAccess";

export function CourseDetailsSectionShared({ slots }: Readonly<CourseDetailsSectionSharedProps>) {
  const { labels: t, canViewTeacher, canViewQuota } = useQuotaFormAccess();
  const {
    renderHeader,
    TeacherAutocomplete,
    rootGap,
    fieldsContainerSx,
    overrideEndAdornment,
    overrideNotice,
    classesLeftInputSx,
  } = slots;

  if (!canViewQuota && !canViewTeacher) {
    return <ProfileRestrictedSection title={t.sections.courseDetails} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: rootGap }}>
      {renderHeader(t.sections.courseDetails)}

      <Box sx={fieldsContainerSx}>
        <TeacherField TeacherAutocomplete={TeacherAutocomplete} />
        <TotalClassesField />
        <ClassesLeftField
          overrideEndAdornment={overrideEndAdornment}
          overrideNotice={overrideNotice}
          classesLeftInputSx={classesLeftInputSx}
        />
      </Box>
    </Box>
  );
}
