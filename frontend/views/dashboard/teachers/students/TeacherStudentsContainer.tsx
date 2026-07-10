"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { teacherAssignedStudentsQueryDocument } from "@/frontend/graphql/sharedDocuments";

export function TeacherStudentsContainer() {
  const t = useTranslations("dashboard.teacherStudents");
  const { data, loading, error } = useQuery(teacherAssignedStudentsQueryDocument);

  const rows = data?.teacherAssignedStudents?.rows ?? [];

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewStudents]}>
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
        {!loading && !error ? (
          <Stack spacing={1}>
            {rows.length === 0 ? (
              <Typography sx={{ color: theme => theme.palette.text.secondary }}>{t("noStudents")}</Typography>
            ) : (
              rows.map(row => (
                <Box
                  key={row.id}
                  sx={theme => ({
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.border.light}`,
                    backgroundColor: theme.palette.surfaceContainerLowest,
                  })}
                >
                  <Typography sx={{ typography: "titleLg", fontWeight: 600 }}>{row.name}</Typography>
                  <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                    {t("statusLabel", { status: row.status ?? "" })}
                  </Typography>
                  <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                    {t("quotaLabel", {
                      remaining: row.classesRemaining ?? 0,
                      total: row.classesTotal ?? 0,
                    })}
                  </Typography>
                  <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                    {t("hoursLabel", { hours: row.hoursPerWeek ?? 0 })}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        ) : null}
      </PageContainer>
    </RequirePermission>
  );
}
