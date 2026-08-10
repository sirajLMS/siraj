"use client";

import { CurrencyCode, type ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";

const VALID_CURRENCY_CODES = new Set<string>(Object.values(CurrencyCode));

function isCurrencyCode(value: string): value is CurrencyCode {
  return VALID_CURRENCY_CODES.has(value);
}

function toCurrencyCode(value: string | null): CurrencyCode | null {
  if (value !== null && isCurrencyCode(value)) {
    return value;
  }
  return null;
}

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
      displayCurrency={toCurrencyCode(profile.displayCurrency)}
      baseLabels={baseLabels}
    />
  );
}
