"use client";

import { Box, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { PhoneDisplay } from "@/frontend/common/components/ui/display";
import type { SupervisorProfileViewModel } from "@/frontend/common/views/dashboard/supervisor/profile/useSupervisorProfileViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function SupervisorProfileDesktopView({
  labels,
  loading,
  error,
  profile,
}: Readonly<SupervisorProfileViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading && !profile ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error && !profile ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.errors.failedToLoad}</Typography>
      ) : null}
      {!loading && !error && !profile ? (
        <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.errors.notFound}</Typography>
      ) : null}
      {profile ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography sx={{ typography: "titleLg", mb: 2 }}>{labels.sections.account}</Typography>
              <Stack spacing={1.5}>
                <ProfileField label={labels.fields.fullName} value={profile.name || labels.notSet} />
                <ProfileField label={labels.fields.status} value={profile.status ?? labels.notSet} />
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography sx={{ typography: "titleLg", mb: 2 }}>{labels.sections.contact}</Typography>
              <Stack spacing={1.5}>
                <ProfileField label={labels.fields.email} value={profile.email ?? labels.notSet} />
                <Stack spacing={0.25}>
                  <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {labels.fields.phone}
                  </Typography>
                  <PhoneDisplay
                    phone={profile.phone}
                    fallback={labels.notSet}
                    typographyVariant="bodyMd"
                    sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}
                  />
                </Stack>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography sx={{ typography: "titleLg", mb: 2 }}>{labels.sections.role}</Typography>
              <ProfileField label={labels.fields.roleName} value={profile.roleName ?? labels.notSet} />
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </DesktopPageContainer>
  );
}

function ProfileField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}>
        {value}
      </Typography>
    </Stack>
  );
}
