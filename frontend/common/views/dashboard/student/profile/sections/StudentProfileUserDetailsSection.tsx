"use client";

import type { CurrencyCode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";

type StudentProfileUserDetailsSectionProps = {
  readonly profile: StudentProfileRow;
  readonly scope: ProfileScope;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
  readonly timezoneLabel: string;
  readonly currencyLabel: string;
  readonly baseLabels: ProfileSharedBaseLabels;
};

export function StudentProfileUserDetailsSection({
  profile,
  scope,
  sectionTitle,
  phoneLabel,
  timezoneLabel,
  currencyLabel,
  baseLabels,
}: Readonly<StudentProfileUserDetailsSectionProps>) {
  return (
    <UserDetailsProfileSection
      scope={scope}
      sectionTitle={sectionTitle}
      phoneLabel={phoneLabel}
      timezoneLabel={timezoneLabel}
      currencyLabel={currencyLabel}
      phone={profile.phone}
      timezone={profile.timezone}
      displayCurrency={(profile.displayCurrency as CurrencyCode | null) ?? null}
      baseLabels={baseLabels}
    />
  );
}
