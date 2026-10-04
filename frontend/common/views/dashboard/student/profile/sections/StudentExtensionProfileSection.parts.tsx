import CakeOutlined from "@mui/icons-material/CakeOutlined";
import LanguageOutlined from "@mui/icons-material/LanguageOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import WcOutlined from "@mui/icons-material/WcOutlined";
import { Stack } from "@mui/material";
import { formatDateInput, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import { SectionPanel } from "@/frontend/common/components/ui";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { LanguageSelector } from "@/frontend/common/components/ui/input/languageSelector/LanguageSelector";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { getLanguageByCode } from "@/frontend/common/lib/locale";
import { toIanaTimezone } from "@/frontend/common/lib/timezone";
import type { StudentPortalProfileEditDraft } from "@/frontend/common/stores/studentPortalProfileStore";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import type {
  StudentProfileEditableSectionProps,
  StudentProfileSectionLabels,
} from "@/frontend/common/views/dashboard/student/profile/sections/studentProfileSection.types";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";

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

export function StudentExtensionProfileEditSection({
  sectionTitle,
  labels,
  draft,
  onDraftChange,
  timezoneOverrideLabel,
}: Readonly<StudentExtensionProfileEditSectionProps>) {
  const validDate = parseDateInput(draft.dateOfBirth);

  return (
    <SectionPanel title={sectionTitle}>
      <Stack spacing={2}>
        <AppDatePicker
          value={validDate}
          onChange={date => onDraftChange({ dateOfBirth: formatDateInput(date) })}
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
            value={draft.timezoneOverride ? toIanaTimezone(draft.timezoneOverride) : null}
            onChangeAction={value => {
              onDraftChange({ timezoneOverride: value ?? "" });
            }}
            label={timezoneOverrideLabel}
            fullWidth
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}

export function StudentExtensionProfileViewSection({
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
