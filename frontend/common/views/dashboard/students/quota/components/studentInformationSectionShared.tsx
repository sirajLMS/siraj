"use client";

import { Box } from "@mui/material";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import {
  DateOfBirthField,
  GenderField,
  LanguageField,
  StudentNameField,
} from "@/frontend/common/views/dashboard/students/quota/components/studentInformationSectionShared.parts";
import type { StudentInformationSectionSharedProps } from "@/frontend/common/views/dashboard/students/quota/components/studentInformationSectionShared.types";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/useQuotaFormAccess";

export function StudentInformationSectionShared({ slots }: Readonly<StudentInformationSectionSharedProps>) {
  const { labels: t } = useQuotaFormAccess();
  const { canView } = useStudentFieldAccess();
  const {
    DatePicker,
    LanguageDisplay,
    GenderSelector,
    SectionHeader,
    sectionHeaderIcon: SectionHeaderIcon,
    rootGap,
    fieldsGap,
    gridTemplateColumns,
    genderFieldPx,
    rootSx,
  } = slots;

  if (!canView("student_identity")) {
    return <ProfileRestrictedSection title={t.sections.studentInfo} />;
  }

  return (
    <Box
      sx={[{ display: "flex", flexDirection: "column", gap: rootGap }, ...(Array.isArray(rootSx) ? rootSx : [rootSx])]}
    >
      <SectionHeader title={t.sections.studentInfo} icon={SectionHeaderIcon} />
      <Box sx={{ display: "grid", gridTemplateColumns, gap: fieldsGap }}>
        <StudentNameField />
        <DateOfBirthField DatePicker={DatePicker} />
        <LanguageField LanguageDisplay={LanguageDisplay} />
        <GenderField GenderSelector={GenderSelector} genderFieldPx={genderFieldPx} />
      </Box>
    </Box>
  );
}
