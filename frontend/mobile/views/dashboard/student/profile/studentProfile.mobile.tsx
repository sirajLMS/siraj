"use client";

import {
  ArrowBackOutlined,
  AssignmentOutlined,
  CalendarTodayOutlined,
  EditOutlined,
  PersonOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import { Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { AvatarImageField, ProfileAvatarView } from "@/frontend/common/components/ui/input/avatarImageField";
import { AppLanguage, Gender, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import type {
  AcademicMetricsGridProps,
  ParentInfoSectionProps,
  PersonalInfoSectionProps,
  ProfileActionsProps,
  ProfileSnackbarProps,
} from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import {
  MobileContentStack,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { MobileFormErrorSnackbar, MobileFormSuccessSnackbar } from "@/frontend/mobile/components/ui/form/snackbar";
import { useAppTranslation } from "@/shared/locale";

function ProfileField({ label, value }: Readonly<{ label: string; value: string }>): React.ReactNode {
  return (
    <Stack spacing={0.5}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
        {value}
      </Typography>
    </Stack>
  );
}

function AcademicMetricsGrid({ title, profile, labels }: AcademicMetricsGridProps): React.ReactNode {
  if (!profile) {
    return null;
  }

  const academicMetrics: readonly MetricItem[] = [
    {
      key: "teacher",
      label: labels.teacher,
      count: profile.teacherName ?? "—",
      icon: SchoolOutlined,
      labelKey: "teacher",
    },
    {
      key: "hoursPerWeek",
      label: labels.hoursPerWeek,
      count: profile.hoursPerWeek ?? 0,
      icon: CalendarTodayOutlined,
      labelKey: "hoursPerWeek",
    },
    {
      key: "classesRemaining",
      label: labels.classesRemaining,
      count: profile.classesRemaining ?? 0,
      icon: PersonOutlined,
      labelKey: "classesRemaining",
    },
    {
      key: "classesTotal",
      label: labels.classesTotal,
      count: profile.classesTotal ?? 0,
      icon: AssignmentOutlined,
      labelKey: "classesTotal",
    },
  ];

  return (
    <MobileSectionPanel title={title} contentInset={false}>
      <MobileMetricCardGrid metrics={academicMetrics} />
    </MobileSectionPanel>
  );
}

function PersonalInfoSection({
  title,
  profile,
  draft,
  labels,
  isEditing,
  formattedDateOfBirth,
  onDraftChange,
}: PersonalInfoSectionProps): React.ReactNode {
  if (!profile) {
    return null;
  }

  return (
    <MobileSectionPanel title={title}>
      <Stack spacing={2}>
        <Stack>
          <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
            {profile.name}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {profile.status}
          </Typography>
        </Stack>

        {isEditing ? (
          <>
            <TextField
              label={labels.phone}
              value={draft.phone}
              onChange={e => onDraftChange({ phone: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label={labels.dateOfBirth}
              type="date"
              value={draft.dateOfBirth}
              onChange={e => onDraftChange({ dateOfBirth: e.target.value })}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="mobile-profile-gender-label" shrink>
                {labels.gender}
              </InputLabel>
              <Select
                labelId="mobile-profile-gender-label"
                label={labels.gender}
                value={draft.gender}
                onChange={e => onDraftChange({ gender: e.target.value })}
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value={Gender.Male}>{Gender.Male}</MenuItem>
                <MenuItem value={Gender.Female}>{Gender.Female}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="mobile-profile-language-label" shrink>
                {labels.language}
              </InputLabel>
              <Select
                labelId="mobile-profile-language-label"
                label={labels.language}
                value={draft.language}
                onChange={e => onDraftChange({ language: e.target.value })}
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value={AppLanguage.En}>English</MenuItem>
                <MenuItem value={AppLanguage.Ar}>العربية</MenuItem>
              </Select>
            </FormControl>
            <ProfileField label={labels.email} value={profile.email ?? "—"} />
          </>
        ) : (
          <>
            <ProfileField label={labels.email} value={profile.email ?? "—"} />
            <ProfileField label={labels.phone} value={profile.phone ?? "—"} />
            <ProfileField label={labels.dateOfBirth} value={formattedDateOfBirth} />
            <ProfileField label={labels.gender} value={profile.gender ?? "—"} />
            <ProfileField label={labels.language} value={profile.language ?? "—"} />
          </>
        )}
      </Stack>
    </MobileSectionPanel>
  );
}

function ParentInfoSection({
  title,
  profile,
  draft,
  labels,
  isEditing,
  onDraftChange,
}: ParentInfoSectionProps): React.ReactNode {
  if (!profile) {
    return null;
  }

  return (
    <MobileSectionPanel title={title}>
      <Stack spacing={2}>
        <ProfileField label={labels.parentName} value={profile.parentName ?? "—"} />
        <ProfileField label={labels.parentEmail} value={profile.parentEmail ?? "—"} />
        {isEditing ? (
          <TextField
            label={labels.parentPhone}
            value={draft.parentPhone}
            onChange={e => onDraftChange({ parentPhone: e.target.value })}
            fullWidth
            size="small"
          />
        ) : (
          <ProfileField label={labels.parentPhone} value={profile.parentPhone ?? "—"} />
        )}
      </Stack>
    </MobileSectionPanel>
  );
}

function ProfileActions({
  isEditing,
  saving,
  labels,
  onCancelEdit,
  onSave,
  onBackToDashboard,
}: ProfileActionsProps): React.ReactNode {
  if (isEditing) {
    return (
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" fullWidth onClick={onCancelEdit} disabled={saving}>
          {labels.cancel}
        </Button>
        <Button variant="contained" fullWidth onClick={() => void onSave()} disabled={saving}>
          {labels.saveChanges}
        </Button>
      </Stack>
    );
  }

  return (
    <Button
      variant="outlined"
      fullWidth
      startIcon={<ArrowBackOutlined />}
      sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
      onClick={onBackToDashboard}
    >
      {labels.backToDashboard}
    </Button>
  );
}

function ProfileSnackbar({
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  onSnackbarClose,
}: ProfileSnackbarProps): React.ReactNode {
  if (snackbarSeverity === "success") {
    return <MobileFormSuccessSnackbar open={snackbarOpen} message={snackbarMessage} onClose={onSnackbarClose} />;
  }
  return <MobileFormErrorSnackbar open={snackbarOpen} message={snackbarMessage} onClose={onSnackbarClose} />;
}

export function StudentProfileMobileView({
  profile,
  labels,
  loading,
  saving,
  isEditing,
  draft,
  formattedDateOfBirth,
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  scope,
  activeTab,
  onBackToDashboard,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
  onSave,
  onSnackbarClose,
  onUploadAvatar,
}: Readonly<StudentProfileViewModel>) {
  const editAvatarTitle = useAppTranslation().profileTranslations.base.editAvatarTitle;

  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  if (loading || !profile) {
    return (
      <MobilePageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader
          title={labels.pageTitle}
          titleVariant="headlineMd"
          actions={
            isEditing ? undefined : (
              <Button size="small" variant="contained" startIcon={<EditOutlined />} onClick={onStartEdit}>
                {labels.editProfile}
              </Button>
            )
          }
        />

        {isEditing ? (
          <AvatarImageField
            label={labels.avatar}
            title={editAvatarTitle}
            value={draft.avatarUrl}
            onChange={url => onDraftChange({ avatarUrl: url })}
            onUploadAvatar={onUploadAvatar}
            disabled={saving}
          />
        ) : (
          <ProfileAvatarView imageUrl={profile.avatarUrl} label={profile.name} title={profile.name} />
        )}

        <PersonalInfoSection
          title={labels.personalInfo}
          profile={profile}
          draft={draft}
          labels={labels}
          isEditing={isEditing}
          formattedDateOfBirth={formattedDateOfBirth}
          onDraftChange={onDraftChange}
        />

        {(profile.parentName || isEditing) && (
          <ParentInfoSection
            title={labels.parentInfo}
            profile={profile}
            draft={draft}
            labels={labels}
            isEditing={isEditing}
            onDraftChange={onDraftChange}
          />
        )}

        <AcademicMetricsGrid title={labels.academicInfo} profile={profile} labels={labels} />

        <ProfileActions
          isEditing={isEditing}
          saving={saving}
          labels={labels}
          onCancelEdit={onCancelEdit}
          onSave={onSave}
          onBackToDashboard={onBackToDashboard}
        />
      </MobileContentStack>

      <ProfileSnackbar
        snackbarOpen={snackbarOpen}
        snackbarMessage={snackbarMessage}
        snackbarSeverity={snackbarSeverity}
        onSnackbarClose={onSnackbarClose}
      />
    </MobilePageContainer>
  );
}
