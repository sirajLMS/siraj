"use client";

import AttachMoneyOutlined from "@mui/icons-material/AttachMoneyOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { CurrencyDisplay } from "@/frontend/common/components/ui/display/currencyDisplay";
import { PhoneDisplay } from "@/frontend/common/components/ui/display/phoneDisplay/PhoneDisplay";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import type { CurrencyCode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { useProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/useProfileSharedBaseLabels";

type UserDetailsProfileSectionProps = {
  readonly scope?: ProfileScope;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
  readonly timezoneLabel: string;
  readonly currencyLabel: string;
  readonly phone: string | null | undefined;
  readonly timezone: string | null | undefined;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly baseLabels?: ProfileSharedBaseLabels;
};

export function UserDetailsProfileSection({
  scope,
  sectionTitle,
  phoneLabel,
  timezoneLabel,
  currencyLabel,
  phone,
  timezone,
  displayCurrency,
  baseLabels,
}: Readonly<UserDetailsProfileSectionProps>) {
  const fallbackBaseLabels = useProfileSharedBaseLabels();
  const t = baseLabels ?? fallbackBaseLabels;
  const { canView, canViewField } = useProfileFieldAccess({ scope });

  const canViewContact = canView("core_contact");
  const canViewIdentity = canView("core_identity");
  const showPhone = canViewContact && canViewField("core_contact");
  const showTimezone = canViewContact && canViewField("core_contact");
  const showCurrency = canViewIdentity && canViewField("core_identity");

  if (!canViewContact && !canViewIdentity) {
    return null;
  }

  return (
    <SectionPanel title={sectionTitle}>
      <Stack spacing={1}>
        {showPhone ? (
          <ProfileFieldRow
            icon={PhoneOutlined}
            label={phoneLabel}
            value={<PhoneDisplay phone={phone} fallback={t.notSet} />}
          />
        ) : null}
        {showTimezone ? (
          <ProfileFieldRow
            icon={ScheduleOutlined}
            label={timezoneLabel}
            value={<TimezoneDisplay timezone={timezone} fallback={t.notSet} />}
          />
        ) : null}
        {showCurrency ? (
          <ProfileFieldRow
            icon={AttachMoneyOutlined}
            label={currencyLabel}
            value={<CurrencyDisplay code={displayCurrency} fallback={t.notSet} />}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
