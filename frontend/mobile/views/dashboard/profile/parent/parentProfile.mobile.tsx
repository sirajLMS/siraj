"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ParentProfileEditForm } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileEditForm";
import { ParentExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/ParentExtensionProfileSection";
import type { ParentAdminData } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { toParentSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { hasParentBillingData, hasParentSocialData } from "@/frontend/common/views/dashboard/profile/parent/utils";
import { PaymentMethodsTab } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { MeetingConfigsTab } from "@/frontend/common/views/dashboard/profile/teacher/meeting/MeetingConfigsTab";
import { MobileContentStack, MobileSectionPanel } from "@/frontend/mobile/components/ui";

export function ParentProfileMobileView({
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
    if (!hasParentSocialData(parentData)) {
      return <ProfileRestrictedSection title={pt.sections.social} />;
    }
    return (
      <MobileSectionPanel title={pt.sections.social}>
        <Stack spacing={2}>
          {parentData?.facebook && (
            <Stack sx={{ gap: 0.25 }}>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.facebook}
              </Typography>
              <Typography variant="bodyMd">{parentData.facebook}</Typography>
            </Stack>
          )}
          {parentData?.whatsapp && (
            <Stack sx={{ gap: 0.25 }}>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.whatsapp}
              </Typography>
              <Typography variant="bodyMd">{parentData.whatsapp}</Typography>
            </Stack>
          )}
          {parentData?.twitter && (
            <Stack sx={{ gap: 0.25 }}>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.twitter}
              </Typography>
              <Typography variant="bodyMd">{parentData.twitter}</Typography>
            </Stack>
          )}
        </Stack>
      </MobileSectionPanel>
    );
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
    if (!hasParentBillingData(adminData)) {
      return <ProfileRestrictedSection title={pt.sections.billing} />;
    }
    return (
      <MobileSectionPanel title={pt.sections.billing}>
        <Stack spacing={2}>
          {adminData.invoiceType && (
            <Stack sx={{ gap: 0.25 }}>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.invoiceType}
              </Typography>
              <Typography variant="bodyMd">{adminData.invoiceType}</Typography>
            </Stack>
          )}
          {adminData.feeAmount && adminData.currency && (
            <Stack sx={{ gap: 0.25 }}>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.feeAmount}
              </Typography>
              <Typography variant="bodyMd">
                {adminData.feeAmount} {adminData.currency}
              </Typography>
            </Stack>
          )}
          {adminData.lifecycleStatus && (
            <Stack sx={{ gap: 0.25 }}>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.lifecycleStatus}
              </Typography>
              <Typography variant="bodyMd">{adminData.lifecycleStatus}</Typography>
            </Stack>
          )}
        </Stack>
      </MobileSectionPanel>
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
      <MobileSectionPanel title={pt.sections.students}>
        <Typography variant="bodyMd" color="text.secondary">
          {pt.students.empty}
        </Typography>
      </MobileSectionPanel>
    );
  };

  if (mode === ProfileMode.View) {
    return (
      <MobileContentStack>
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
      </MobileContentStack>
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
