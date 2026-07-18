"use client";

import { EditOutlined } from "@mui/icons-material";
import { Alert, Avatar, Box, Button, Grid, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StaffProfileEditForm } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileEditForm";
import { PermissionsSection } from "@/frontend/common/views/dashboard/profile/staff/sections/PermissionsSection";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";
import { DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { useAppTranslation } from "@/shared/locale";

type StaffProfileTranslations = ReturnType<typeof useAppTranslation>["profileTranslations"];

interface StaffProfileDesktopGuardProps {
  readonly activeTab: string;
  readonly scope: ProfileScope;
  readonly isAdminScope: boolean;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly staffData: StaffProfileViewModel["staffData"] | null | undefined;
  readonly permissionGroups: StaffProfileViewModel["permissionGroups"];
  readonly permissionOverrides: StaffProfileViewModel["permissionOverrides"];
  readonly canView: StaffProfileViewModel["canView"];
  readonly translations: StaffProfileTranslations;
}

function StaffProfileDesktopGuard(props: Readonly<StaffProfileDesktopGuardProps>) {
  const {
    activeTab,
    scope,
    isAdminScope,
    loading,
    error,
    staffData,
    permissionGroups,
    permissionOverrides,
    canView,
    translations,
  } = props;
  const t = translations.base;
  const st = translations.staff;

  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "permissions" && isAdminScope) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={st.sections.permissions} />
        <PermissionsSection permissionGroups={permissionGroups} permissionOverrides={permissionOverrides} />
      </DesktopPageContainer>
    );
  }

  if (activeTab !== "profile") {
    return null;
  }

  if (loading && !staffData) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={st.subtitle} subtitle={st.ownSubtitle} />
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <div className="loading-spinner" />
        </Box>
      </DesktopPageContainer>
    );
  }

  if (error && !staffData) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={st.subtitle} subtitle={st.ownSubtitle} />
        <Alert severity="error" sx={{ mx: 3, my: 2 }} onClose={() => {}}>
          {t.errors.failedToLoad}
          <Button color="inherit" size="small" onClick={() => {}}>
            {t.actions.retry}
          </Button>
        </Alert>
      </DesktopPageContainer>
    );
  }

  if (!staffData) {
    const canViewIdentity = canView("core_identity");
    if (!canViewIdentity) {
      return <ProfileRestrictedSection />;
    }
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={st.subtitle} subtitle={st.ownSubtitle} />
        <Alert severity="warning" sx={{ mx: 3, my: 2 }}>
          {t.errors.notFound}
        </Alert>
      </DesktopPageContainer>
    );
  }

  return null;
}

export function StaffProfileDesktopView({
  scope,
  mode,
  isAdminScope,
  loading,
  error,
  isSaving,
  onSubmitOwn,
  onSubmitAdmin,
  staffData,
  avatarUrl,
  displayCurrency,
  permissionGroups,
  permissionOverrides,
  activeTab,
  canView,
}: Readonly<StaffProfileViewModel>) {
  const translations = useAppTranslation().profileTranslations;
  const t = translations.base;
  const st = translations.staff;

  const guard = (
    <StaffProfileDesktopGuard
      activeTab={activeTab}
      scope={scope}
      isAdminScope={isAdminScope}
      loading={loading}
      error={error}
      staffData={staffData}
      permissionGroups={permissionGroups}
      permissionOverrides={permissionOverrides}
      canView={canView}
      translations={translations}
    />
  );
  if (guard !== null) {
    return guard;
  }

  const renderAccountSection = () => {
    if (!canView("core_identity") && !(isAdminScope && canView("staff_role"))) {
      return null;
    }
    return (
      <DesktopSectionPanel title={st.sections.account}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar src={avatarUrl ?? undefined} sx={{ width: 80, height: 80 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="headlineMd">{staffData?.name ?? ""}</Typography>
            <Typography variant="bodyMd" color="text.secondary">
              {staffData?.email ?? ""}
            </Typography>
            {staffData?.phone && (
              <Typography variant="bodyMd" color="text.secondary">
                {staffData.phone}
              </Typography>
            )}
            {displayCurrency && (
              <Typography variant="labelMd" color="text.secondary">
                {st.fields.displayCurrency}: {displayCurrency}
              </Typography>
            )}
          </Box>
        </Stack>
      </DesktopSectionPanel>
    );
  };

  const renderCompensationSection = () => {
    if (!canView("staff_role")) {
      return null;
    }
    if (isAdminScope) {
      return (
        <DesktopSectionPanel title={st.sections.compensation}>
          <Stack spacing={2}>
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.hourlyRate}
              </Typography>
              {staffData?.hourlyRate} {staffData?.rateCurrency}
            </Typography>
          </Stack>
        </DesktopSectionPanel>
      );
    }
    if (staffData?.hourlyRate || staffData?.rateCurrency) {
      return (
        <DesktopSectionPanel title={st.sections.compensation}>
          <Stack spacing={2}>
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.hourlyRate}
              </Typography>
              {staffData.hourlyRate} {staffData.rateCurrency}
            </Typography>
          </Stack>
        </DesktopSectionPanel>
      );
    }
    return null;
  };

  const renderContactSection = () => {
    if (!canView("core_contact")) {
      return null;
    }
    return (
      <DesktopSectionPanel title={st.sections.contact}>
        <Stack spacing={1}>
          {staffData?.phone && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.phone}
              </Typography>
              {staffData.phone}
            </Typography>
          )}
        </Stack>
      </DesktopSectionPanel>
    );
  };

  if (mode === ProfileMode.View) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader
          title={staffData?.name ?? ""}
          subtitle={staffData?.email ?? ""}
          actions={[
            <Button
              key="edit"
              variant="outlined"
              startIcon={<EditOutlined />}
              onClick={() => {
                // Navigation to edit mode handled by container
              }}
            >
              {t.actions.edit}
            </Button>,
          ]}
        />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            {isAdminScope ? (
              <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
                {st.adminBanner}
              </Typography>
            ) : null}

            {renderAccountSection()}
            {renderContactSection()}
            {renderCompensationSection()}
          </Grid>
        </Grid>
      </DesktopPageContainer>
    );
  }

  // Edit mode
  if (scope === ProfileScope.Own) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={t.actions.edit} />
        <Stack spacing={3}>
          <StaffProfileEditForm
            staffData={staffData}
            displayCurrency={displayCurrency}
            isAdminScope={isAdminScope}
            isSaving={isSaving}
            onSubmit={values => onSubmitOwn(values)}
          />
        </Stack>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={t.actions.edit} />
      <Stack spacing={3}>
        <StaffProfileEditForm
          staffData={staffData}
          displayCurrency={displayCurrency}
          isAdminScope={isAdminScope}
          isSaving={isSaving}
          onSubmit={values => onSubmitAdmin(values)}
        />
      </Stack>
    </DesktopPageContainer>
  );
}
