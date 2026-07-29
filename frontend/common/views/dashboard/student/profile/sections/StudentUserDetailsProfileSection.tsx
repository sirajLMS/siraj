"use client";

import AttachMoneyOutlined from "@mui/icons-material/AttachMoneyOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { Stack, TextField } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { PhoneDisplay } from "@/frontend/common/components/ui/display/phoneDisplay/PhoneDisplay";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import type {
  StudentProfileEditableSectionProps,
  StudentProfileSectionBaseProps,
} from "@/frontend/common/views/dashboard/student/profile/sections/studentProfileSection.types";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";

type StudentUserDetailsProfileSectionProps = StudentProfileSectionBaseProps &
  Partial<Pick<StudentProfileEditableSectionProps, "isEditing" | "draft" | "onDraftChange">> & {
    readonly currencyLabel: string;
  };

export function StudentUserDetailsProfileSection({
  profile,
  labels,
  sectionTitle,
  notSetLabel,
  timezoneLabel,
  currencyLabel,
  enforceFieldAccess = false,
  isEditing = false,
  draft,
  onDraftChange,
}: Readonly<StudentUserDetailsProfileSectionProps>) {
  const { canView, showField } = useStudentFieldAccess();
  const canViewIdentity = enforceFieldAccess ? canView("student_identity") : true;

  if (!canViewIdentity) {
    return null;
  }

  const showPhone = enforceFieldAccess ? showField(profile.phone, "student_identity") : true;
  const showTimezone = enforceFieldAccess ? showField(profile.timezone, "student_identity") : true;
  const showCurrency = enforceFieldAccess ? showField(profile.displayCurrency, "student_identity") : true;

  if (isEditing && draft && onDraftChange) {
    return (
      <SectionPanel title={sectionTitle}>
        <Stack spacing={2}>
          <TextField
            label={labels.phone}
            value={draft.phone}
            onChange={e => onDraftChange({ phone: e.target.value })}
            fullWidth
            size="small"
          />
          <TimezoneSelect
            value={draft.timezone ? toGraphqlIanaTimezone(draft.timezone) : null}
            onChangeAction={value => {
              onDraftChange({ timezone: value ? fromGraphqlIanaTimezone(value) : "" });
            }}
            label={timezoneLabel}
            fullWidth
          />
          <CurrencySelect
            currency={draft.displayCurrency ? (getCurrencyByCode(draft.displayCurrency as CurrencyCode) ?? null) : null}
            setCurrencyAction={selected => onDraftChange({ displayCurrency: selected.code })}
            label={currencyLabel}
            fullWidth
          />
        </Stack>
      </SectionPanel>
    );
  }

  if (enforceFieldAccess && !showPhone && !showTimezone && !showCurrency) {
    return <ProfileRestrictedSection title={sectionTitle} />;
  }

  return (
    <SectionPanel title={sectionTitle}>
      <Stack spacing={1}>
        {showPhone ? (
          <ProfileFieldRow
            icon={PhoneOutlined}
            label={labels.phone}
            value={<PhoneDisplay phone={profile.phone} fallback={notSetLabel} />}
          />
        ) : null}
        {showTimezone ? (
          <ProfileFieldRow
            icon={ScheduleOutlined}
            label={timezoneLabel}
            value={<TimezoneDisplay timezone={profile.timezone} fallback={notSetLabel} />}
          />
        ) : null}
        {showCurrency ? (
          <ProfileFieldRow
            icon={AttachMoneyOutlined}
            label={currencyLabel}
            value={profile.displayCurrency ?? notSetLabel}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
