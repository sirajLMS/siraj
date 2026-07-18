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
import { FormErrorSnackbar, FormSuccessSnackbar } from "@/frontend/common/components/ui";
import { AppLanguage, Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { DesktopMetricCard } from "@/frontend/desktop/components/ui/card/MetricCard";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date/DesktopAppDatePicker";

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
  onBackToDashboard,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
  onSave,
  onSnackbarClose,
}: Readonly<StudentProfileViewModel>) {
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
          isEditing ? (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={onCancelEdit} disabled={saving}>
                {labels.cancel}
              </Button>
              <Button variant="contained" onClick={() => void onSave()} disabled={saving}>
                {labels.saveChanges}
              </Button>
            </Stack>
          ) : (
            <Button variant="contained" startIcon={<EditOutlined />} onClick={onStartEdit}>
              {labels.editProfile}
            </Button>
          )
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DesktopSectionPanel title={labels.personalInfo} sx={{ height: "100%" }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box
                  sx={theme => ({
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    backgroundColor: theme.palette.primary.main,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  <Typography variant="headlineLg" sx={theme => ({ color: theme.palette.onPrimary })}>
                    {profile.name.charAt(0).toUpperCase()}
                  </Typography>
                </Box>
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
                    <InputLabel id="profile-gender-label">{labels.gender}</InputLabel>
                    <Select
                      labelId="profile-gender-label"
                      label={labels.gender}
                      value={draft.gender}
                      onChange={e => onDraftChange({ gender: e.target.value as Gender | "" })}
                    >
                      <MenuItem value="">—</MenuItem>
                      <MenuItem value={Gender.Male}>{Gender.Male}</MenuItem>
                      <MenuItem value={Gender.Female}>{Gender.Female}</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel id="profile-language-label">{labels.language}</InputLabel>
                    <Select
                      labelId="profile-language-label"
                      label={labels.language}
                      value={draft.language}
                      onChange={e => onDraftChange({ language: e.target.value as AppLanguage | "" })}
                    >
                      <MenuItem value="">—</MenuItem>
                      <MenuItem value={AppLanguage.En}>English</MenuItem>
                      <MenuItem value={AppLanguage.Ar}>العربية</MenuItem>
                    </Select>
                  </FormControl>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <EmailOutlined sx={theme => ({ color: theme.palette.onSurfaceVariant })} fontSize="small" />
                    <ProfileField label={labels.email} value={profile.email ?? "—"} />
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <EmailOutlined sx={theme => ({ color: theme.palette.onSurfaceVariant })} fontSize="small" />
                    <ProfileField label={labels.email} value={profile.email ?? "—"} />
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <PhoneOutlined sx={theme => ({ color: theme.palette.onSurfaceVariant })} fontSize="small" />
                    <ProfileField label={labels.phone} value={profile.phone ?? "—"} />
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <CalendarTodayOutlined sx={theme => ({ color: theme.palette.onSurfaceVariant })} fontSize="small" />
                    <ProfileField label={labels.dateOfBirth} value={formattedDateOfBirth} />
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <LanguageOutlined sx={theme => ({ color: theme.palette.onSurfaceVariant })} fontSize="small" />
                    <ProfileField label={labels.language} value={profile.language ?? "—"} />
                  </Stack>
                  <ProfileField label={labels.gender} value={profile.gender ?? "—"} />
                </Stack>
              )}
            </Stack>
          </DesktopSectionPanel>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          {(profile.parentName || isEditing) && (
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
          )}

          <DesktopSectionPanel title={labels.academicInfo} sx={{ mb: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <DesktopMetricCard
                  icon={SchoolOutlined}
                  label={labels.teacher}
                  value={profile.teacherName ?? "—"}
                  variant="compact"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <DesktopMetricCard
                  icon={CalendarTodayOutlined}
                  label={labels.hoursPerWeek}
                  value={profile.hoursPerWeek ?? 0}
                  variant="compact"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <DesktopMetricCard
                  icon={PersonOutlined}
                  label={labels.classesRemaining}
                  value={profile.classesRemaining ?? 0}
                  variant="compact"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <DesktopMetricCard
                  icon={AssignmentOutlined}
                  label={labels.classesTotal}
                  value={profile.classesTotal ?? 0}
                  variant="compact"
                />
              </Grid>
            </Grid>
          </DesktopSectionPanel>
        </Grid>
      </Grid>

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

      {snackbarSeverity === "success" ? (
        <FormSuccessSnackbar open={snackbarOpen} message={snackbarMessage} onClose={onSnackbarClose} />
      ) : (
        <FormErrorSnackbar open={snackbarOpen} message={snackbarMessage} onClose={onSnackbarClose} />
      )}
    </DesktopPageContainer>
  );
}
