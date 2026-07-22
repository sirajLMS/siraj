"use client";

import {
  ArrowBackOutlined,
  AssignmentOutlined,
  CalendarTodayOutlined,
  EditOutlined,
  EmailOutlined,
  LanguageOutlined,
  PersonOutlined,
  PhoneOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { FormErrorSnackbar, FormSuccessSnackbar } from "@/frontend/common/components/ui";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { AppLanguage, Gender, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { StudentPortalProfileEditDraft } from "@/frontend/common/stores/studentPortalProfileStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date/DesktopAppDatePicker";
import { useAppTranslation } from "@/shared/locale";

type ProfileLabels = StudentProfileViewModel["labels"];
type DraftPatch = (patch: Partial<StudentPortalProfileEditDraft>) => void;

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

function ProfileHeaderActions({
  isEditing,
  saving,
  labels,
  onCancelEdit,
  onSave,
  onStartEdit,
}: Readonly<{
  isEditing: boolean;
  saving: boolean;
  labels: ProfileLabels;
  onCancelEdit: () => void;
  onSave: () => Promise<void>;
  onStartEdit: () => void;
}>): React.ReactNode {
  if (isEditing) {
    return (
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={onCancelEdit} disabled={saving}>
          {labels.cancel}
        </Button>
        <Button variant="contained" onClick={() => void onSave()} disabled={saving}>
          {labels.saveChanges}
        </Button>
      </Stack>
    );
  }
  return (
    <Button variant="contained" startIcon={<EditOutlined />} onClick={onStartEdit}>
      {labels.editProfile}
    </Button>
  );
}

function EditingAvatarField({
  labels,
  editAvatarTitle,
  draft,
  saving,
  onDraftChange,
  onUploadAvatar,
}: Readonly<{
  labels: ProfileLabels;
  editAvatarTitle: string;
  draft: StudentPortalProfileEditDraft;
  saving: boolean;
  onDraftChange: DraftPatch;
  onUploadAvatar: (file: File) => Promise<{ url: string }>;
}>): React.ReactNode {
  return (
    <Box sx={{ mb: 3 }}>
      <AvatarImageField
        label={labels.avatar}
        title={editAvatarTitle}
        value={draft.avatarUrl}
        onChange={url => onDraftChange({ avatarUrl: url })}
        onUploadAvatar={onUploadAvatar}
        disabled={saving}
      />
    </Box>
  );
}

function ProfileRowWithIcon({
  icon: Icon,
  field,
}: Readonly<{ icon: React.ElementType; field: React.ReactNode }>): React.ReactNode {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Icon sx={(theme: Theme) => ({ color: theme.palette.onSurfaceVariant })} fontSize="small" />
      {field}
    </Stack>
  );
}

function PersonalInfoReadView({
  profile,
  labels,
  formattedDateOfBirth,
}: Readonly<{ profile: StudentProfileRow; labels: ProfileLabels; formattedDateOfBirth: string }>): React.ReactNode {
  return (
    <Stack spacing={2}>
      <ProfileRowWithIcon
        icon={EmailOutlined}
        field={<ProfileField label={labels.email} value={profile.email ?? "—"} />}
      />
      <ProfileRowWithIcon
        icon={PhoneOutlined}
        field={<ProfileField label={labels.phone} value={profile.phone ?? "—"} />}
      />
      <ProfileRowWithIcon
        icon={CalendarTodayOutlined}
        field={<ProfileField label={labels.dateOfBirth} value={formattedDateOfBirth} />}
      />
      <ProfileRowWithIcon
        icon={LanguageOutlined}
        field={<ProfileField label={labels.language} value={profile.language ?? "—"} />}
      />
      <ProfileField label={labels.gender} value={profile.gender ?? "—"} />
    </Stack>
  );
}

function PersonalInfoEditView({
  profile,
  labels,
  draft,
  onDraftChange,
}: Readonly<{
  profile: StudentProfileRow;
  labels: ProfileLabels;
  draft: StudentPortalProfileEditDraft;
  onDraftChange: DraftPatch;
}>): React.ReactNode {
  return (
    <Stack spacing={2}>
      <TextField
        label={labels.phone}
        value={draft.phone}
        onChange={e => onDraftChange({ phone: e.target.value })}
        fullWidth
        size="small"
      />
      <DesktopAppDatePicker
        label={labels.dateOfBirth}
        value={draft.dateOfBirth ? new Date(draft.dateOfBirth) : null}
        onChange={date =>
          onDraftChange({
            dateOfBirth: date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : "",
          })
        }
        slotProps={{ textField: { size: "small", fullWidth: true } }}
      />
      <FormControl fullWidth size="small">
        <InputLabel id="profile-gender-label" shrink>
          {labels.gender}
        </InputLabel>
        <Select
          labelId="profile-gender-label"
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
        <InputLabel id="profile-language-label" shrink>
          {labels.language}
        </InputLabel>
        <Select
          labelId="profile-language-label"
          label={labels.language}
          value={draft.language}
          onChange={e => onDraftChange({ language: e.target.value })}
        >
          <MenuItem value="">—</MenuItem>
          <MenuItem value={AppLanguage.En}>English</MenuItem>
          <MenuItem value={AppLanguage.Ar}>العربية</MenuItem>
        </Select>
      </FormControl>
      <ProfileRowWithIcon
        icon={EmailOutlined}
        field={<ProfileField label={labels.email} value={profile.email ?? "—"} />}
      />
    </Stack>
  );
}

function PersonalInfoPanel({
  profile,
  labels,
  isEditing,
  draft,
  formattedDateOfBirth,
  onDraftChange,
}: Readonly<{
  profile: StudentProfileRow;
  labels: ProfileLabels;
  isEditing: boolean;
  draft: StudentPortalProfileEditDraft;
  formattedDateOfBirth: string;
  onDraftChange: DraftPatch;
}>): React.ReactNode {
  return (
    <DesktopSectionPanel title={labels.personalInfo} sx={{ height: "100%" }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          {isEditing ? null : <UserAvatar src={profile.avatarUrl} label={profile.name} size={80} />}
          <Stack>
            <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
              {profile.name}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {profile.status}
            </Typography>
          </Stack>
        </Stack>
        <Divider />
        {isEditing ? (
          <PersonalInfoEditView profile={profile} labels={labels} draft={draft} onDraftChange={onDraftChange} />
        ) : (
          <PersonalInfoReadView profile={profile} labels={labels} formattedDateOfBirth={formattedDateOfBirth} />
        )}
      </Stack>
    </DesktopSectionPanel>
  );
}

function ParentInfoPanel({
  profile,
  labels,
  isEditing,
  draft,
  onDraftChange,
}: Readonly<{
  profile: StudentProfileRow;
  labels: ProfileLabels;
  isEditing: boolean;
  draft: StudentPortalProfileEditDraft;
  onDraftChange: DraftPatch;
}>): React.ReactNode {
  if (!(profile.parentName || isEditing)) return null;
  return (
    <DesktopSectionPanel title={labels.parentInfo} sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ProfileField label={labels.parentName} value={profile.parentName ?? "—"} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ProfileField label={labels.parentEmail} value={profile.parentEmail ?? "—"} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
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
        </Grid>
      </Grid>
    </DesktopSectionPanel>
  );
}

function AcademicInfoPanel({
  profile,
  labels,
}: Readonly<{ profile: StudentProfileRow; labels: ProfileLabels }>): React.ReactNode {
  const metrics = [
    {
      key: "teacher",
      count: profile.teacherName ?? "—",
      labelKey: "teacher",
      label: labels.teacher,
      icon: SchoolOutlined,
    },
    {
      key: "hours-per-week",
      count: profile.hoursPerWeek ?? 0,
      labelKey: "hours-per-week",
      label: labels.hoursPerWeek,
      icon: CalendarTodayOutlined,
    },
    {
      key: "classes-remaining",
      count: profile.classesRemaining ?? 0,
      labelKey: "classes-remaining",
      label: labels.classesRemaining,
      icon: PersonOutlined,
    },
    {
      key: "classes-total",
      count: profile.classesTotal ?? 0,
      labelKey: "classes-total",
      label: labels.classesTotal,
      icon: AssignmentOutlined,
    },
  ] satisfies MetricItem[];
  return (
    <DesktopSectionPanel title={labels.academicInfo} sx={{ mb: 3 }}>
      <DesktopMetricCardGrid metrics={metrics} size={{ xs: 12, md: 4 }} />
    </DesktopSectionPanel>
  );
}

function BackToDashboardButton({
  labels,
  onBackToDashboard,
}: Readonly<{ labels: ProfileLabels; onBackToDashboard: () => void }>): React.ReactNode {
  return (
    <Box sx={{ mt: 3 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackOutlined />}
        sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
        onClick={onBackToDashboard}
      >
        {labels.backToDashboard}
      </Button>
    </Box>
  );
}

function ProfileSnackbars({
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  onSnackbarClose,
}: Readonly<{
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: "success" | "error";
  onSnackbarClose: () => void;
}>): React.ReactNode {
  if (snackbarSeverity === "success") {
    return <FormSuccessSnackbar open={snackbarOpen} message={snackbarMessage} onClose={onSnackbarClose} />;
  }
  return <FormErrorSnackbar open={snackbarOpen} message={snackbarMessage} onClose={onSnackbarClose} />;
}

export function StudentProfileDesktopView({
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
      <DesktopPageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        actions={
          <ProfileHeaderActions
            isEditing={isEditing}
            saving={saving}
            labels={labels}
            onCancelEdit={onCancelEdit}
            onSave={onSave}
            onStartEdit={onStartEdit}
          />
        }
      />

      {isEditing ? (
        <EditingAvatarField
          labels={labels}
          editAvatarTitle={editAvatarTitle}
          draft={draft}
          saving={saving}
          onDraftChange={onDraftChange}
          onUploadAvatar={onUploadAvatar}
        />
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <PersonalInfoPanel
            profile={profile}
            labels={labels}
            isEditing={isEditing}
            draft={draft}
            formattedDateOfBirth={formattedDateOfBirth}
            onDraftChange={onDraftChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <ParentInfoPanel
            profile={profile}
            labels={labels}
            isEditing={isEditing}
            draft={draft}
            onDraftChange={onDraftChange}
          />
          <AcademicInfoPanel profile={profile} labels={labels} />
        </Grid>
      </Grid>

      <BackToDashboardButton labels={labels} onBackToDashboard={onBackToDashboard} />

      <ProfileSnackbars
        snackbarOpen={snackbarOpen}
        snackbarMessage={snackbarMessage}
        snackbarSeverity={snackbarSeverity}
        onSnackbarClose={onSnackbarClose}
      />
    </DesktopPageContainer>
  );
}
