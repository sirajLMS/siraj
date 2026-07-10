"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { MeetingJoinAction } from "@/frontend/components/ui/display/meetingConfig/MeetingJoinAction";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { teacherAssignedClassesQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { isJoinableByExecutionState } from "@/shared/lib/meeting/isJoinableByExecutionState";

export function TeacherClassListContainer() {
  const t = useTranslations("dashboard.teacherClassList");
  const { data, loading, error } = useQuery(teacherAssignedClassesQueryDocument);
  const rows = data?.teacherAssignedClasses?.rows ?? [];

  return (
    <RequirePermission permissions={[AppPermission.SessionViewDetails]}>
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
              <Typography sx={{ color: theme => theme.palette.text.secondary }}>{t("noClasses")}</Typography>
            ) : (
              rows.map(row => (
                <Box
                  key={row.id}
                  sx={theme => ({
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.border.light}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  })}
                >
                  <Box>
                    <Typography sx={{ typography: "titleLg", fontWeight: 600 }}>{row.studentName}</Typography>
                    <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                      {new Date(row.scheduledStartAt ?? "").toLocaleString()}
                    </Typography>
                    <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
                      {row.executionState}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {isJoinableByExecutionState(row.executionState, row.outcome) ? (
                      <MeetingJoinAction
                        variant="icon"
                        joinUrl={row.meetingJoinUrl}
                        meeting={row.effectiveMeeting}
                        emptyRole="teacher"
                        setupHref="/profile?tab=meeting"
                      />
                    ) : null}
                    <Button component={Link} href={`/classes/${row.id}`} variant="outlined" size="small">
                      {t("viewDetails")}
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Stack>
        ) : null}
      </PageContainer>
    </RequirePermission>
  );
}
