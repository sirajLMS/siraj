"use client";

import { Box, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { PhoneDisplay } from "@/frontend/common/components/ui/display";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import type { TeacherOwnProfileViewModel } from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function TeacherOwnProfileDesktopView({
  labels,
  loading,
  error,
  profile,
  salaryDisplay,
}: Readonly<TeacherOwnProfileViewModel>) {
  const { t } = labels;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{t.errors.failedToLoad}</Typography>
      ) : null}
      {profile ? (
        <>
          <DisplayCurrencyHint />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography sx={{ typography: "titleLg", mb: 2 }}>{t.sections.contact}</Typography>
                <Stack spacing={1}>
                  <Typography sx={{ typography: "bodyMd" }}>{profile.name}</Typography>
                  <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                    {profile.email}
                  </Typography>
                  <PhoneDisplay
                    phone={profile.phone}
                    fallback={t.notSet}
                    typographyVariant="bodyMd"
                    sx={theme => ({ color: theme.palette.text.secondary })}
                  />
                  <TimezoneDisplay timezone={profile.timezone} fallback={t.notSet} />
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography sx={{ typography: "titleLg", mb: 2 }}>{t.sections.salary}</Typography>
                <Stack spacing={1}>
                  <Typography sx={{ typography: "bodyMd" }}>{salaryDisplay}</Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      ) : null}
    </DesktopPageContainer>
  );
}

export default TeacherOwnProfileDesktopView;
