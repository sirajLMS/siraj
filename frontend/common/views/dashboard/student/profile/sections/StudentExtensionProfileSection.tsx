"use client";

import CakeOutlined from "@mui/icons-material/CakeOutlined";
import LanguageOutlined from "@mui/icons-material/LanguageOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import WcOutlined from "@mui/icons-material/WcOutlined";
import { Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { AppDatePicker } from "@/frontend/common/components/ui/form";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { LanguageSelector } from "@/frontend/common/components/ui/input/languageSelector/LanguageSelector";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { getLanguageByCode } from "@/frontend/common/lib/locale";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import type { StudentPortalProfileEditDraft } from "@/frontend/common/stores/studentPortalProfileStore";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import type {
  StudentProfileEditableSectionProps,
  StudentProfileSectionBaseProps,
  StudentProfileSectionLabels,
} from "@/frontend/common/views/dashboard/student/profile/sections/studentProfileSection.types";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";

type StudentExtensionProfileSectionProps = StudentProfileSectionBaseProps &
  Partial<Pick<StudentProfileEditableSectionProps, "isEditing" | "draft" | "onDraftChange">> & {
    readonly formattedDateOfBirth?: string;
    readonly timezoneOverrideLabel?: string;
  };

type StudentExtensionProfileEditSectionProps = {
  readonly sectionTitle: string;
  readonly labels: StudentProfileSectionLabels;
  readonly draft: StudentPortalProfileEditDraft;
  readonly onDraftChange: StudentProfileEditableSectionProps["onDraftChange"];
  readonly timezoneOverrideLabel?: string;
};

type StudentExtensionProfileViewSectionProps = {
  readonly sectionTitle: string;
  readonly labels: StudentProfileSectionLabels;
  readonly profile: StudentProfileRow;
  readonly notSetLabel: string;
  readonly dateOfBirthDisplay: string;
  readonly showDateOfBirth: boolean;
  readonly showGender: boolean;
  readonly showLanguage: boolean;
  readonly showTimezoneOverride: boolean;
  readonly timezoneOverrideLabel?: string;
};

function StudentExtensionProfileEditSection({
  sectionTitle,
  labels,
  draft,
  onDraftChange,
  timezoneOverrideLabel,
}: Readonly<StudentExtensionProfileEditSectionProps>) {
  const dateValue = draft.dateOfBirth ? new Date(draft.dateOfBirth) : null;
  const validDate = dateValue && !Number.isNaN(dateValue.getTime()) ? dateValue : null;

  return (
    <SectionPanel title={sectionTitle}>
      <Stack spacing={2}>
        <AppDatePicker
          value={validDate}
          onChange={date => {
            if (date && !Number.isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              onDraftChange({ dateOfBirth: `${year}-${month}-${day}` });
            } else {
              onDraftChange({ dateOfBirth: "" });
            }
          }}
          slotProps={{
            textField: {
              label: labels.dateOfBirth,
              variant: "outlined",
              fullWidth: true,
              size: "small",
              slotProps: { htmlInput: { autoComplete: "off" } },
            },
          }}
        />
        <GenderSelector
          gender={draft.gender ? draft.gender : null}
          setGenderAction={gender => onDraftChange({ gender: gender ?? "" })}
          fullWidth
          allowEmpty
          labels={{ title: labels.gender }}
        />
        <LanguageSelector
          fullWidth
          label={labels.language}
          language={draft.language ? getLanguageByCode(draft.language) : undefined}
          setLanguageAction={option => onDraftChange({ language: option.code })}
        />
        {timezoneOverrideLabel ? (
          <TimezoneSelect
            value={draft.timezoneOverride ? toGraphqlIanaTimezone(draft.timezoneOverride) : null}
            onChangeAction={value => {
              onDraftChange({ timezoneOverride: value ? fromGraphqlIanaTimezone(value) : "" });
            }}
            label={timezoneOverrideLabel}
            fullWidth
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}

function StudentExtensionProfileViewSection({
  sectionTitle,
  labels,
  profile,
  notSetLabel,
  dateOfBirthDisplay,
  showDateOfBirth,
  showGender,
  showLanguage,
  showTimezoneOverride,
  timezoneOverrideLabel,
}: Readonly<StudentExtensionProfileViewSectionProps>) {
  return (
    <SectionPanel title={sectionTitle}>
      <Stack spacing={1}>
        {showDateOfBirth ? (
          <ProfileFieldRow icon={CakeOutlined} label={labels.dateOfBirth} value={dateOfBirthDisplay} />
        ) : null}
        {showGender ? (
          <ProfileFieldRow icon={WcOutlined} label={labels.gender} value={profile.gender ?? notSetLabel} />
        ) : null}
        {showLanguage ? (
          <ProfileFieldRow icon={LanguageOutlined} label={labels.language} value={profile.language ?? notSetLabel} />
        ) : null}
        {showTimezoneOverride && timezoneOverrideLabel ? (
          <ProfileFieldRow
            icon={ScheduleOutlined}
            label={timezoneOverrideLabel}
            value={profile.timezoneOverride ?? notSetLabel}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}

function getIdentityFieldVisibility(
  enforceFieldAccess: boolean,
  canViewField: (field: "student_identity") => boolean,
  timezoneOverrideLabel?: string
) {
  const canViewIdentityField = enforceFieldAccess ? canViewField("student_identity") : true;

  return {
    showDateOfBirth: canViewIdentityField,
    showGender: canViewIdentityField,
    showLanguage: canViewIdentityField,
    showTimezoneOverride: enforceFieldAccess ? canViewIdentityField : Boolean(timezoneOverrideLabel),
  };
}

export function StudentExtensionProfileSection({
  profile,
  labels,
  sectionTitle,
  notSetLabel,
  enforceFieldAccess = false,
  isEditing = false,
  draft,
  onDraftChange,
  formattedDateOfBirth,
  timezoneOverrideLabel,
}: Readonly<StudentExtensionProfileSectionProps>) {
  const { canView, canViewField } = useStudentFieldAccess();
  const canViewIdentity = enforceFieldAccess ? canView("student_identity") : true;

  if (!canViewIdentity) {
    return null;
  }

  if (isEditing && draft && onDraftChange) {
    return (
      <StudentExtensionProfileEditSection
        sectionTitle={sectionTitle}
        labels={labels}
        draft={draft}
        onDraftChange={onDraftChange}
        timezoneOverrideLabel={timezoneOverrideLabel}
      />
    );
  }

  const visibility = getIdentityFieldVisibility(enforceFieldAccess, canViewField, timezoneOverrideLabel);

  return (
    <StudentExtensionProfileViewSection
      sectionTitle={sectionTitle}
      labels={labels}
      profile={profile}
      notSetLabel={notSetLabel}
      dateOfBirthDisplay={formattedDateOfBirth ?? profile.dateOfBirth ?? notSetLabel}
      timezoneOverrideLabel={timezoneOverrideLabel}
      {...visibility}
    />
  );
}
