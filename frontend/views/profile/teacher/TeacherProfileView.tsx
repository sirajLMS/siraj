"use client";

import { Grid, Paper, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ProfileByUserIdQuery } from "@/frontend/graphql/generated/gql/operations";

type TeacherProfileData =
  | NonNullable<ProfileByUserIdQuery["profileByUserId"]>["teacherOwnProfile"]
  | NonNullable<ProfileByUserIdQuery["profileByUserId"]>["teacherAdminProfile"];

type TeacherProfileViewProps = {
  readonly teacherData: TeacherProfileData;
};

export function TeacherProfileView({ teacherData }: TeacherProfileViewProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography sx={{ typography: "titleLg", mb: 2 }}>{t("sections.contact")}</Typography>
          <Stack spacing={1}>
            <Typography sx={{ typography: "bodyMd" }}>{teacherData?.name}</Typography>
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
              {teacherData?.email}
            </Typography>
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
              {teacherData?.phone ?? tc("notSet")}
            </Typography>
            {teacherData && "timezone" in teacherData ? (
              <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                {teacherData.timezone}
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography sx={{ typography: "titleLg", mb: 2 }}>{t("sections.salary")}</Typography>
          <Stack spacing={1}>
            {teacherData && "hourlyRate" in teacherData ? (
              <Typography sx={{ typography: "bodyMd" }}>
                {t("baseSalary", {
                  amount: teacherData.hourlyRate ?? "0",
                  currency: teacherData.rateCurrency ?? "USD",
                })}
              </Typography>
            ) : null}
            {teacherData && "paymentMethod" in teacherData ? (
              <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                {t("paymentMethod", { method: teacherData.paymentMethod ?? tc("notSet") })}
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
