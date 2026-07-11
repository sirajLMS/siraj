"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import type { FutureClass } from "@/frontend/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  teacherFutureScheduleQueryDocument,
  updateSessionStatusLeaveMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useFutureScheduleDateStore } from "@/frontend/stores/futureScheduleDateStore";
import { logger } from "@/frontend/utils/logger";
import { FutureScheduleView } from "@/frontend/views/dashboard/teachers/futureSchedule/FutureScheduleView";
import type {
  FutureScheduleContainerProps,
  ImportantNoteItem,
  SupportContactData,
} from "@/frontend/views/dashboard/teachers/futureSchedule/types";
import { getErrorMessage } from "@/shared/utils/error";

export function FutureScheduleContainer({ teacherId }: Readonly<FutureScheduleContainerProps>) {
  const t = useTranslations("dashboard.teacherFutureSchedule");
  const notifications = useNotifications();
  const { data, loading, error, refetch } = useQuery(teacherFutureScheduleQueryDocument, {
    variables: { teacherId },
  });
  const [requestLeave] = useMutation(updateSessionStatusLeaveMutationDocument);

  const selectedDate = useFutureScheduleDateStore(s => s.selectedDate);
  const setSelectedDate = useFutureScheduleDateStore(s => s.setSelectedDate);

  const schedule = data?.teacherFutureSchedule;

  const handleRequestLeave = async (classInstanceId: string) => {
    try {
      await requestLeave({
        variables: {
          classInstanceId,
          leaveReason: t("defaultLeaveReason"),
        },
      });
      await refetch();
      notifications.show(t("notifications.leaveRequested"), { severity: "success" });
    } catch (err) {
      const message = getErrorMessage(err);
      logger.error({ caller: "FutureScheduleContainer" }, `Leave request failed: ${message}`);
      if (message.includes("quota") || message.includes("Leave quota exceeded")) {
        notifications.show(t("errors.quotaExceeded"), { severity: "error" });
      } else {
        notifications.show(message || t("errors.leaveRequestFailed"), { severity: "error" });
      }
    }
  };

  if (loading && !data) {
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
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.error.main })}>
          {t("errors.failedToLoad")}
        </Typography>
      </Box>
    );
  }

  const classes = (schedule.classes ?? []) as FutureClass[];
  const notes: ImportantNoteItem[] = (schedule.importantNotes ?? []).map(n => ({
    id: n.id ?? "",
    title: n.title ?? "",
    body: n.body,
    priority: n.priority,
    startsAt: n.startsAt,
    expiresAt: n.expiresAt,
  }));
  const contact: SupportContactData | null = schedule.supportContact
    ? {
        id: schedule.supportContact.id,
        name: schedule.supportContact.name,
        role: schedule.supportContact.role,
        avatarUrl: schedule.supportContact.avatarUrl,
        phone: schedule.supportContact.phone,
      }
    : null;

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewAssigned]}>
      <FutureScheduleView
        classes={classes}
        leaveQuotaUsed={schedule.leaveQuotaUsed ?? 0}
        leaveQuotaTotal={schedule.leaveQuotaTotal ?? 0}
        totalClasses={schedule.totalClasses ?? 0}
        onRequestLeave={handleRequestLeave}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        notes={notes}
        contact={contact}
      />
    </RequirePermission>
  );
}
