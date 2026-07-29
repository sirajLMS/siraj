"use client";

import { Alert, Box, Button, Grid, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ParentProfileEditForm } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileEditForm";
import { BillingSection } from "@/frontend/common/views/dashboard/profile/parent/sections/BillingSection";
import type { ParentAdminData } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { SocialSection } from "@/frontend/common/views/dashboard/profile/parent/sections/SocialSection";
import { toParentSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { PaymentMethodsTab } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { ParentExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/ParentExtensionProfileSection";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { MeetingConfigsTab } from "@/frontend/common/views/dashboard/profile/teacher/meeting/MeetingConfigsTab";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { Translation, useAppTranslation } from "@/shared/locale";

export function ParentProfileDesktopView({
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
}: Readonly<ParentProfileViewModel>) {
  const { base: t, parent: pt } = labels;
  const tErrors = useAppTranslation(Translation.Errors);

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

  const adminData = isAdminScope ? (parentData as ParentAdminData) : null;

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
    return <ParentExtensionProfileSection mode="view" labels={pt} scope={scope} adminData={adminData} />;
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

  const renderStudentsSection = () => {
    if (!canView("parent_students")) {
      return null;
    }
    return (
      <DesktopSectionPanel title={pt.sections.students}>
        <Typography variant="bodyMd" color="text.secondary">
          {pt.students.empty}
        </Typography>
      </DesktopSectionPanel>
    );
  };

  if (mode === ProfileMode.View) {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            {isAdminScope ? (
              <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
                {pt.adminBanner}
              </Typography>
            ) : null}
            {renderContactSection()}
            {renderSocialSection()}
            {renderIdentitySection()}
            {renderBillingSection()}
            {renderStudentsSection()}
          </Stack>
        </Grid>
      </Grid>
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
