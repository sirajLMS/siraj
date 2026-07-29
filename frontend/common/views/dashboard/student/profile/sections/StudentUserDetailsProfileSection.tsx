"use client";

import AttachMoneyOutlined from "@mui/icons-material/AttachMoneyOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { PhoneDisplay } from "@/frontend/common/components/ui/display/phoneDisplay/PhoneDisplay";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { PhoneInput } from "@/frontend/common/components/ui/input/phoneInput/PhoneInput";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
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
  const { canView, canViewField } = useStudentFieldAccess();
  const canViewIdentity = enforceFieldAccess ? canView("student_identity") : true;

  if (!canViewIdentity) {
    return null;
  }

  const showPhone = enforceFieldAccess ? canViewField("student_identity") : true;
  const showTimezone = enforceFieldAccess ? canViewField("student_identity") : true;
  const showCurrency = enforceFieldAccess ? canViewField("student_identity") : true;

  if (isEditing && draft && onDraftChange) {
    return (
      <SectionPanel title={sectionTitle}>
        <Stack spacing={2}>
          <PhoneInput
            label={labels.phone}
            value={draft.phone || null}
            onChangeAction={value => onDraftChange({ phone: value ?? "" })}
            fullWidth
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
