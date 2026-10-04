"use client";

import { Typography } from "@mui/material";
import type React from "react";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { toIanaTimezoneOrNull } from "@/frontend/common/lib/timezone";
import { StaffExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/StaffExtensionProfileSection";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { StaffProfileEditForm } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileEditForm";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/staff/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/staff/sections/StaffAdminOnlySection";
import type {
  StaffProfileData,
  StaffProfileViewLabels,
  StaffSectionLabelsBundle,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";
import type { ProfileScope } from "@/shared/constants/profile.enum";

interface StaffProfileViewContentProps {
  readonly scope: ProfileScope;
  readonly staff: StaffProfileViewLabels["staff"];
  readonly staffData: StaffProfileData;
  readonly isAdminScope: boolean;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly targetUserId: string;
  readonly profilePhone: string | null | undefined;
  readonly profileTimezone: string | null | undefined;
  readonly sectionLabels: StaffSectionLabelsBundle;
  readonly ViewContentWrapper: React.ComponentType<{ readonly children: React.ReactNode }>;
}

export function StaffProfileViewContent(props: Readonly<StaffProfileViewContentProps>): React.JSX.Element {
  const { staff: st, staffData, sectionLabels } = props;

  return (
    <props.ViewContentWrapper>
      {props.isAdminScope ? (
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
          {st.adminBanner}
        </Typography>
      ) : null}
      {props.isAdminScope ? (
        <AccountSection
          mode="view"
          labels={sectionLabels}
          scope={props.scope}
          staffData={staffData}
          isAdminScope={props.isAdminScope}
          displayCurrency={props.displayCurrency}
          targetUserId={props.targetUserId}
        />
      ) : null}
      <UserDetailsProfileSection
        scope={props.scope}
        sectionTitle={st.sections.contact}
        phoneLabel={st.fields.phone}
        timezoneLabel={st.fields.timezone}
        currencyLabel={st.fields.displayCurrency}
        phone={props.profilePhone ?? staffData.phone}
        timezone={toIanaTimezoneOrNull(props.profileTimezone)}
        displayCurrency={props.displayCurrency}
        baseLabels={sectionLabels.baseLabels}
      />
      <StaffExtensionProfileSection
        scope={props.scope}
        labels={sectionLabels}
        hourlyRate={staffData.hourlyRate}
        rateCurrency={staffData.rateCurrency}
      />
      {props.isAdminScope ? (
        <AdminOnlySection
          mode="view"
          labels={sectionLabels}
          profile={{
            userId: props.targetUserId,
            name: staffData.name ?? null,
            email: staffData.email ?? null,
            status: staffData.status ?? null,
          }}
        />
      ) : null}
    </props.ViewContentWrapper>
  );
}

interface StaffProfileEditFormSlotProps {
  readonly staffData: StaffProfileData;
  readonly avatarUrl: string | null | undefined;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly profileTimezone: string | null | undefined;
  readonly targetUserId: string;
  readonly isAdminScope: boolean;
  readonly isSaving: boolean;
  readonly onSubmit: StaffProfileViewModel["onSubmitAdmin"];
}

export function StaffProfileEditFormSlot(props: Readonly<StaffProfileEditFormSlotProps>): React.JSX.Element {
  return (
    <StaffProfileEditForm
      staffData={props.staffData}
      avatarUrl={props.avatarUrl}
      displayCurrency={props.displayCurrency}
      profileTimezone={props.profileTimezone}
      targetUserId={props.targetUserId}
      isAdminScope={props.isAdminScope}
      isSaving={props.isSaving}
      onSubmit={props.onSubmit}
    />
  );
}
