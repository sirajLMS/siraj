"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  teacherFutureScheduleQueryDocument,
  updateSessionStatusLeaveMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import { getErrorMessage } from "@/shared/utils/error";
import { FutureScheduleView } from "./FutureScheduleView";

export function FutureScheduleContainer() {
  const t = useTranslations("dashboard.teacherFutureSchedule");
  const { data, loading, error, refetch } = useQuery(teacherFutureScheduleQueryDocument);
  const [requestLeave] = useMutation(updateSessionStatusLeaveMutationDocument);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const schedule = data?.teacherFutureSchedule;

  const handleRequestLeave = async (classInstanceId: string) => {
    setLeaveError(null);
    try {
      await requestLeave({
        variables: {
          classInstanceId,
          leaveReason: t("defaultLeaveReason"),
        },
      });
      await refetch();
    } catch (err) {
      const message = getErrorMessage(err);
      logger.error({ caller: "FutureScheduleContainer" }, `Leave request failed: ${message}`);
      if (message.includes("quota") || message.includes("Leave quota exceeded")) {
        setLeaveError(t("errors.quotaExceeded"));
      } else {
        setLeaveError(message || t("errors.leaveRequestFailed"));
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
        <Stack sx={{ alignItems: "center" }} spacing={2}>
          <CircularProgress />
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t("loading")}
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !schedule) {
    return (
      <Box sx={{ py: 4, px: 3 }}>
        <Alert severity="error">{t("errors.failedToLoad")}</Alert>
      </Box>
    );
  }

  const classes = schedule.classes ?? [];

  return (
    <RequirePermission permissions={[AppPermission.ScheduleFilterAdvanced]}>
      <FutureScheduleView
        classes={classes}
        leaveQuotaUsed={schedule.leaveQuotaUsed ?? 0}
        leaveQuotaTotal={schedule.leaveQuotaTotal ?? 0}
        totalClasses={schedule.totalClasses ?? 0}
        onRequestLeave={handleRequestLeave}
        leaveError={leaveError}
        onDismissError={() => setLeaveError(null)}
      />
    </RequirePermission>
  );
}
