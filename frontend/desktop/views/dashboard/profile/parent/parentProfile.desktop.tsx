"use client";

import { Alert, Box, Button, Grid, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ParentProfileEditForm } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileEditForm";
import type { ParentAdminData } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import type { ParentProfileViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import {
  hasParentBillingData,
  hasParentIdentityData,
  hasParentSocialData,
} from "@/frontend/common/views/dashboard/profile/parent/utils";
import { PaymentMethodsTab } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { MeetingConfigsTab } from "@/frontend/common/views/dashboard/profile/teacher/meeting/MeetingConfigsTab";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function ParentProfileDesktopView({
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
  parentId: _parentId,
  meetingTabHref: _meetingTabHref,
  associatedStudents: _associatedStudents,
  canView,
}: Readonly<ParentProfileViewModel>) {
  const t = useAppTranslation().profileTranslations.base;
  const pt = useAppTranslation().profileTranslations.parent;

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
      <DesktopSectionPanel title={pt.sections.social}>
        <Stack spacing={2}>
          {parentData?.facebook && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.facebook}
              </Typography>
              {parentData.facebook}
            </Typography>
          )}
          {parentData?.whatsapp && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.whatsapp}
              </Typography>
              {parentData.whatsapp}
            </Typography>
          )}
          {parentData?.twitter && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.twitter}
              </Typography>
              {parentData.twitter}
            </Typography>
          )}
        </Stack>
      </DesktopSectionPanel>
    );
  };

  const renderIdentitySection = () => {
    if (!isAdminScope || !adminData || !canView("parent_identity")) {
      return null;
    }
    if (!hasParentIdentityData(adminData)) {
      return <ProfileRestrictedSection title={pt.sections.identity} />;
    }
    return (
      <DesktopSectionPanel title={pt.sections.identity}>
        <Stack spacing={2}>
          {adminData.nationality && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.nationality}
              </Typography>
              {adminData.nationality}
            </Typography>
          )}
          {adminData.address && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.address}
              </Typography>
              {adminData.address}
            </Typography>
          )}
        </Stack>
      </DesktopSectionPanel>
    );
  };

  const renderBillingSection = () => {
    if (!isAdminScope || !adminData || !canView("parent_billing")) {
      return null;
    }
    if (!hasParentBillingData(adminData)) {
      return <ProfileRestrictedSection title={pt.sections.billing} />;
    }
    return (
      <DesktopSectionPanel title={pt.sections.billing}>
        <Stack spacing={2}>
          {adminData.invoiceType && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.invoiceType}
              </Typography>
              {adminData.invoiceType}
            </Typography>
          )}
          {adminData.feeAmount && adminData.currency && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.feeAmount}
              </Typography>
              {adminData.feeAmount} {adminData.currency}
            </Typography>
          )}
          {adminData.timezone && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.timezone}
              </Typography>
              {adminData.timezone}
            </Typography>
          )}
          {adminData.lifecycleStatus && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {pt.fields.lifecycleStatus}
              </Typography>
              {adminData.lifecycleStatus}
            </Typography>
          )}
        </Stack>
      </DesktopSectionPanel>
    );
  };

  const renderContactSection = () => (
    <DesktopSectionPanel title={pt.sections.contact}>
      <Stack spacing={1}>
        {parentData?.phone && (
          <Typography variant="bodyLg">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {pt.fields.phone}
            </Typography>
            {parentData.phone}
          </Typography>
        )}
      </Stack>
    </DesktopSectionPanel>
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
