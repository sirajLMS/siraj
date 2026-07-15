"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { PhoneDisplay } from "@/frontend/common/components/ui/display";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { teacherOwnProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useAppLocale } from "@/frontend/common/providers/LocaleProvider";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { useAppTranslation } from "@/shared/locale/client";

export function TeacherOwnProfileContainer() {
  const t = useAppTranslation("dashboard.teacherOwnProfile");
  const tProfile = useAppTranslation("profile");
  const tErrors = useAppTranslation("errors");
  const locale = useAppLocale();
  const { data, loading, error } = useQuery(teacherOwnProfileQueryDocument);
  const profile = data?.teacherOwnProfile;

  const salaryDisplay = profile
    ? formatCurrencyForDisplay(
        profile.hourlyRate ?? "0",
        profile.rateCurrency ?? CurrencyCode.Usd,
        profile.displayAmount,
        locale,
        buildFxDisplayMessages(
          {
            convertedAmount: tProfile.convertedAmount,
          },
          tErrors,
          {
            convertedTotalApprox: tProfile.convertedTotalApprox,
          }
        )
      )
    : "";

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewOwnProfile]}>
      <PageContainer>
        <PageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />
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
      </PageContainer>
    </RequirePermission>
  );
}
