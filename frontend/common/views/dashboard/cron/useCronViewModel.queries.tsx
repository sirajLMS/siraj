"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type {
  CronRunsQuery_cronRuns_rows,
  CronScheduleFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  cronQueueStatsQueryDocument,
  cronRunsQueryDocument,
  cronRunTriggerMutationDocument,
  cronScheduleCreateMutationDocument,
  cronScheduleDeleteMutationDocument,
  cronSchedulePauseMutationDocument,
  cronScheduleResumeMutationDocument,
  cronSchedulesQueryDocument,
  cronScheduleUpdateMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/cron/cron.documents";

export function useCronQueries(runsSchedule: CronScheduleFieldsFragment | null, runsOpen: boolean) {
  const { data, loading, refetch } = useQuery(cronSchedulesQueryDocument, {
    variables: { input: null },
  });

  const { data: queueStatsData, loading: queueStatsLoading } = useQuery(cronQueueStatsQueryDocument, {
    pollInterval: 30000,
  });

  const { data: runsData, loading: runsLoading } = useQuery(cronRunsQueryDocument, {
    variables: {
      input: runsSchedule
        ? {
            scheduleId: runsSchedule.id ?? "",
            from: null,
            offset: 0,
            status: null,
            statuses: null,
            to: null,
            limit: 50,
          }
        : null,
    },
    skip: !runsOpen || !runsSchedule,
  });

  const rows = useMemo(() => data?.cronSchedules?.rows ?? [], [data?.cronSchedules?.rows]);
  const queueStats = useMemo(() => queueStatsData?.cronQueueStats ?? null, [queueStatsData?.cronQueueStats]);
  const runs = useMemo<CronRunsQuery_cronRuns_rows[]>(() => runsData?.cronRuns?.rows ?? [], [runsData?.cronRuns?.rows]);

  return { rows, queueStats, runs, loading, queueStatsLoading, runsLoading, refetch };
}

export function useCronMutations() {
  const [createSchedule, { loading: creating }] = useMutation(cronScheduleCreateMutationDocument);
  const [updateSchedule, { loading: updating }] = useMutation(cronScheduleUpdateMutationDocument);
  const [pauseSchedule] = useMutation(cronSchedulePauseMutationDocument);
  const [resumeSchedule] = useMutation(cronScheduleResumeMutationDocument);
  const [deleteSchedule, { loading: deleting }] = useMutation(cronScheduleDeleteMutationDocument);
  const [triggerRun] = useMutation(cronRunTriggerMutationDocument);
  const saving = creating || updating;
  return {
    createSchedule,
    updateSchedule,
    pauseSchedule,
    resumeSchedule,
    deleteSchedule,
    triggerRun,
    deleting,
    saving,
  };
}
