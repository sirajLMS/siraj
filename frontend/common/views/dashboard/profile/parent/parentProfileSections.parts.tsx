"use client";

import { Typography } from "@mui/material";
import { toIanaTimezoneOrNull } from "@/frontend/common/lib/timezone";
import { ParentProfileEditForm } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileEditForm";
import type { ParentProfileSlotProps } from "@/frontend/common/views/dashboard/profile/parent/parentProfileShared.parts";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/parent/sections/AdminOnlySection";
import { BillingSection } from "@/frontend/common/views/dashboard/profile/parent/sections/BillingSection";
import { IdentitySection } from "@/frontend/common/views/dashboard/profile/parent/sections/IdentitySection";
import {
  type ParentAdminData,
  type ParentViewData,
  toParentSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { SocialSection } from "@/frontend/common/views/dashboard/profile/parent/sections/SocialSection";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { ProfileMode } from "@/shared/constants/profile.enum";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

function resolveAdminData(isAdminScope: boolean, parentData: ParentViewData): ParentAdminData | null {
  if (isAdminScope && "invoiceType" in parentData) {
    return parentData;
  }
  return null;
}

type ParentProfileSectionsProps = {
  readonly viewModel: Readonly<ParentProfileViewModel> & { readonly slots: ParentProfileSlotProps };
  readonly errorLabels: ErrorsLabels;
};

export function ParentProfileSections({ viewModel, errorLabels }: ParentProfileSectionsProps) {
  const {
    labels,
    scope,
    mode,
    targetUserId,
    isAdminScope,
    loading,
    isSaving,
    onSubmit,
    parentData,
    editData,
    displayCurrency,
    profileTimezone,
    profilePhone,
    parentId,
    associatedStudents,
    canView,
    slots,
  } = viewModel;
  const { base: t, parent: pt } = labels;
  const { ViewContentWrapper, StudentsSection } = slots;

  if (!parentData) {
    return null;
  }

  const adminData = resolveAdminData(isAdminScope, parentData);
  const sectionLabels = {
    parent: pt,
    baseLabels: toParentSharedBaseLabels(t),
  };

  if (mode !== ProfileMode.VIEW) {
    return (
      <ParentProfileEditForm
        parentData={editData}
        targetUserId={targetUserId}
        isAdminScope={isAdminScope}
        isSaving={isSaving}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <ViewContentWrapper>
      {isAdminScope ? (
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
          {pt.adminBanner}
        </Typography>
      ) : null}
      <UserDetailsProfileSection
        scope={scope}
        sectionTitle={pt.sections.contact}
        phoneLabel={pt.fields.phone}
        timezoneLabel={pt.fields.timezone}
        currencyLabel={pt.fields.displayCurrency}
        phone={profilePhone ?? parentData.phone}
        timezone={toIanaTimezoneOrNull(profileTimezone ?? adminData?.timezone)}
        displayCurrency={displayCurrency}
        baseLabels={sectionLabels.baseLabels}
      />
      {canView("parent_social") ? <SocialSection mode="view" labels={pt} parentData={parentData} /> : null}
      {canView("parent_identity") && adminData ? (
        <IdentitySection mode="view" labels={pt} scope={scope} adminData={adminData} />
      ) : null}
      {canView("parent_identity") && adminData ? (
        <AdminOnlySection mode="view" labels={sectionLabels} adminData={adminData} />
      ) : null}
      {canView("parent_billing") && adminData ? (
        <BillingSection
          mode="view"
          labels={{
            parent: pt,
            base: { notSet: t.notSet, convertedTotalApprox: t.convertedTotalApprox },
            errors: errorLabels,
          }}
          adminData={adminData}
          parentId={parentId}
        />
      ) : null}
      {canView("parent_students") ? (
        <StudentsSection
          labels={{ parent: pt, base: t }}
          rows={associatedStudents?.rows ?? []}
          loading={loading}
          emptyMessage={pt.students.empty}
        />
      ) : null}
    </ViewContentWrapper>
  );
}
