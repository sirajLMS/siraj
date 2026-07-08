"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { teacherOwnProfileQueryDocument } from "@/frontend/graphql/sharedDocuments/teacher-portal.documents";

export function TeacherOwnProfileContainer() {
  const t = useTranslations("dashboard.teacherOwnProfile");
  const { data, loading, error } = useQuery(teacherOwnProfileQueryDocument);
  const profile = data?.teacherOwnProfile;

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewOwnProfile]}>
      <PageContainer>
        <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : null}
        {error ? (
          <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.failedToLoad")}</Typography>
        ) : null}
        {profile ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography sx={{ typography: "titleLg", mb: 2 }}>{t("sections.contact")}</Typography>
                <Stack spacing={1}>
                  <Typography sx={{ typography: "bodyMd" }}>{profile.name}</Typography>
                  <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                    {profile.email}
                  </Typography>
                  <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                    {profile.phone ?? t("notSet")}
                  </Typography>
                  <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                    {profile.timezone}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography sx={{ typography: "titleLg", mb: 2 }}>{t("sections.salary")}</Typography>
                <Stack spacing={1}>
                  <Typography sx={{ typography: "bodyMd" }}>
                    {t("baseSalary", {
                      amount: profile.hourlyRate ?? "0",
                      currency: profile.rateCurrency ?? "USD",
                    })}
                  </Typography>
                  <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                    {t("paymentMethod", { method: profile.paymentMethod ?? t("notSet") })}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        ) : null}
      </PageContainer>
    </RequirePermission>
  );
}
