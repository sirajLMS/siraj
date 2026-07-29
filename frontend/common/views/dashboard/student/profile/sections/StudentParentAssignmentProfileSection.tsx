"use client";

import EmailOutlined from "@mui/icons-material/EmailOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import { Stack, TextField } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { PhoneDisplay } from "@/frontend/common/components/ui/display/phoneDisplay/PhoneDisplay";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import type {
  StudentProfileEditableSectionProps,
  StudentProfileSectionBaseProps,
} from "@/frontend/common/views/dashboard/student/profile/sections/studentProfileSection.types";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";

type StudentParentAssignmentProfileSectionProps = StudentProfileSectionBaseProps &
  Partial<Pick<StudentProfileEditableSectionProps, "isEditing" | "draft" | "onDraftChange">>;

export function StudentParentAssignmentProfileSection({
  profile,
  labels,
  sectionTitle,
  notSetLabel,
  enforceFieldAccess = false,
  isEditing = false,
  draft,
  onDraftChange,
}: Readonly<StudentParentAssignmentProfileSectionProps>) {
  const { canView, showField } = useStudentFieldAccess();
  const canViewParent = enforceFieldAccess ? canView("student_parent") : true;

  if (!canViewParent) {
    return null;
  }

  if (!profile.parentName && !isEditing) {
    return null;
  }

  const showParentName = enforceFieldAccess ? showField(profile.parentName, "student_parent") : true;
  const showParentEmail = enforceFieldAccess ? showField(profile.parentEmail, "student_parent") : true;
  const showParentPhone = enforceFieldAccess ? showField(profile.parentPhone, "student_parent") : true;

  if (isEditing && draft && onDraftChange) {
    return (
      <SectionPanel title={sectionTitle}>
        <Stack spacing={2}>
          <ProfileFieldRow icon={PersonOutlined} label={labels.parentName} value={profile.parentName ?? notSetLabel} />
          <ProfileFieldRow icon={EmailOutlined} label={labels.parentEmail} value={profile.parentEmail ?? notSetLabel} />
          <TextField
            label={labels.parentPhone}
            value={draft.parentPhone}
            onChange={e => onDraftChange({ parentPhone: e.target.value })}
            fullWidth
            size="small"
          />
        </Stack>
      </SectionPanel>
    );
  }

  if (enforceFieldAccess && !showParentName && !showParentEmail && !showParentPhone) {
    return <ProfileRestrictedSection title={sectionTitle} />;
  }

  return (
    <SectionPanel title={sectionTitle}>
      <Stack spacing={1}>
        {showParentName ? (
          <ProfileFieldRow icon={PersonOutlined} label={labels.parentName} value={profile.parentName ?? notSetLabel} />
        ) : null}
        {showParentEmail ? (
          <ProfileFieldRow icon={EmailOutlined} label={labels.parentEmail} value={profile.parentEmail ?? notSetLabel} />
        ) : null}
        {showParentPhone ? (
          <ProfileFieldRow
            icon={PhoneOutlined}
            label={labels.parentPhone}
            value={<PhoneDisplay phone={profile.parentPhone} fallback={notSetLabel} />}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
