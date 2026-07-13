"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { parentAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";

export function ParentStudentsContainer() {
  const t = useTranslations("dashboard.parentStudents");
  const { data, loading, error } = useQuery(parentAssignedStudentsQueryDocument);

  const rows = data?.parentAssignedStudents?.rows ?? [];

  return (
    <RequirePermission permissions={[AppPermission.ParentViewStudents]}>
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
                  {row.teacherName ? (
                    <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                      {t("teacherLabel", { teacher: row.teacherName })}
                    </Typography>
                  ) : null}
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
