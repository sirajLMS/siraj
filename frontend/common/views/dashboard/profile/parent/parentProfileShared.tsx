"use client";

import { Alert, Box, Button, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ParentProfileEditForm } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileEditForm";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/parent/sections/AdminOnlySection";
import { BillingSection } from "@/frontend/common/views/dashboard/profile/parent/sections/BillingSection";
import { IdentitySection } from "@/frontend/common/views/dashboard/profile/parent/sections/IdentitySection";
import {
  type ParentAdminData,
  toParentSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { SocialSection } from "@/frontend/common/views/dashboard/profile/parent/sections/SocialSection";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { PaymentMethodsTab } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { MeetingConfigsTab } from "@/frontend/common/views/dashboard/profile/teacher/meeting/MeetingConfigsTab";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface ParentProfileSlotProps {
  readonly ViewContentWrapper: React.FC<{ readonly children: ReactNode }>;
  readonly SectionPanel: React.FC<{ readonly title?: ReactNode; readonly children?: ReactNode }>;
}

function resolveAdminData(
  isAdminScope: boolean,
  parentData: NonNullable<ParentProfileViewModel["parentData"]>
): ParentAdminData | null {
  if (isAdminScope && "invoiceType" in parentData) {
    return parentData;
  }
  return null;
}

export function ParentProfileShared({
  labels,
  scope,
  mode,
  targetUserId,
  activeTab,
  isAdminScope,
  loading,
  error,
  isSaving,
  onSubmit,
  onRetry,
  parentData,
  editData,
  displayCurrency,
  profileTimezone,
  profilePhone,
  parentId: _parentId,
  meetingTabHref: _meetingTabHref,
  associatedStudents: _associatedStudents,
  canView,
  slots,
}: Readonly<ParentProfileViewModel> & { readonly slots: ParentProfileSlotProps }) {
  const { base: t, parent: pt } = labels;
  const tErrors = useAppTranslation(Translation.Errors);
  const { ViewContentWrapper, SectionPanel } = slots;

  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "meeting") {
    return <MeetingConfigsTab targetUserId={targetUserId} scope={scope} />;
  }

  if (activeTab === "paymentMethods") {
    return <PaymentMethodsTab targetUserId={targetUserId} scope={scope} slot="payin" />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  if (loading && !parentData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <div className="loading-spinner" />
      </Box>
    );
  }

  if (error && !parentData) {
    return (
      <Alert severity="error" sx={{ my: 2 }} onClose={() => {}}>
        {t.errors.failedToLoad}
        <Button color="inherit" size="small" onClick={onRetry}>
          {t.actions.retry}
        </Button>
      </Alert>
    );
  }

  if (!parentData) {
    return (
      <Alert severity="warning" sx={{ my: 2 }}>
        {t.errors.notFound}
      </Alert>
    );
  }

  const adminData = resolveAdminData(isAdminScope, parentData);

  const sectionLabels = {
    parent: pt,
    baseLabels: toParentSharedBaseLabels(t),
  };

  const renderContactSection = () => (
    <UserDetailsProfileSection
      scope={scope}
      sectionTitle={pt.sections.contact}
      phoneLabel={pt.fields.phone}
      timezoneLabel={pt.fields.timezone}
      currencyLabel={pt.fields.displayCurrency}
      phone={profilePhone ?? parentData.phone}
      timezone={profileTimezone ?? adminData?.timezone}
      displayCurrency={displayCurrency}
      baseLabels={sectionLabels.baseLabels}
    />
  );

  const renderSocialSection = () => {
    if (!canView("parent_social")) {
      return null;
    }
    return <SocialSection mode="view" labels={pt} parentData={parentData} />;
  };

  const renderIdentitySection = () => {
    if (!isAdminScope || !adminData || !canView("parent_identity")) {
      return null;
    }
    return <IdentitySection mode="view" labels={pt} scope={scope} adminData={adminData} />;
  };

  const renderBillingSection = () => {
    if (!isAdminScope || !adminData || !canView("parent_billing")) {
      return null;
    }
    return (
      <BillingSection
        mode="view"
        labels={{
          parent: pt,
          base: { notSet: t.notSet, convertedTotalApprox: t.convertedTotalApprox },
          errors: tErrors,
        }}
        adminData={adminData}
        parentId={_parentId}
      />
    );
  };

  const renderAdminOnlySection = () => {
    if (!isAdminScope || !adminData || !canView("parent_identity")) {
      return null;
    }
    return <AdminOnlySection mode="view" labels={sectionLabels} adminData={adminData} />;
  };

  const renderStudentsSection = () => {
    if (!canView("parent_students")) {
      return null;
    }
    return (
      <SectionPanel title={pt.sections.students}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {pt.students.empty}
        </Typography>
      </SectionPanel>
    );
  };

  if (mode === ProfileMode.View) {
    return (
      <ViewContentWrapper>
        {isAdminScope ? (
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
            {pt.adminBanner}
          </Typography>
        ) : null}
        {renderContactSection()}
        {renderSocialSection()}
        {renderIdentitySection()}
        {renderAdminOnlySection()}
        {renderBillingSection()}
        {renderStudentsSection()}
      </ViewContentWrapper>
    );
  }

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
