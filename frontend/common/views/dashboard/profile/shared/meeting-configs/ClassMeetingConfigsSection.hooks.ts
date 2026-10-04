"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import {
  classMeetingConfigsQueryDocument,
  classMeetingConfigsWithStatusQueryDocument,
  deleteClassMeetingConfigMutationDocument,
  recurringMeetingConfigsQueryDocument,
  setDefaultClassMeetingConfigMutationDocument,
  updateClassMeetingConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import {
  buildStatusMap,
  type StatusConfigEntry,
  type StatusMap,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection.helpers";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

export function useScopeQueries(scopeId: string, isClassScope: boolean) {
  const {
    data: classData,
    loading: classLoading,
    error: classError,
    refetch: refetchClass,
  } = useQuery(classMeetingConfigsQueryDocument, {
    variables: { classInstanceId: scopeId },
    skip: !isClassScope || !scopeId,
  });

  const {
    data: recurringData,
    loading: recurringLoading,
    error: recurringError,
    refetch: refetchRecurring,
  } = useQuery(recurringMeetingConfigsQueryDocument, {
    variables: { recurringScheduleId: scopeId },
    skip: isClassScope || !scopeId,
  });

  const { data: statusData, loading: statusLoading } = useQuery(classMeetingConfigsWithStatusQueryDocument, {
    variables: { classInstanceId: scopeId },
    skip: !isClassScope || !scopeId,
  });

  const loading = classLoading || recurringLoading || statusLoading;
  const error = classError ?? recurringError;
  const refetch = isClassScope ? refetchClass : refetchRecurring;
  const configs = useMemo(
    () => (isClassScope ? classData?.classMeetingConfigs : recurringData?.recurringMeetingConfigs) ?? [],
    [isClassScope, classData?.classMeetingConfigs, recurringData?.recurringMeetingConfigs]
  );

  const statusMap = useMemo<StatusMap>(
    () => (isClassScope ? buildStatusMap(statusData?.classMeetingConfigs) : new Map<string, StatusConfigEntry>()),
    [isClassScope, statusData]
  );

  return { loading, error, refetch, configs, statusMap };
}

export function useMeetingConfigMutations(
  deleteId: string | null,
  refetch: () => Promise<unknown>,
  setDeleteId: (id: string | null) => void,
  setErrorMessage: (msg: string | null) => void,
  tManager: MeetingConfigManagerLabels
) {
  const [deleteConfig, { loading: deleting }] = useMutation(deleteClassMeetingConfigMutationDocument);
  const [setDefault, { loading: settingDefault }] = useMutation(setDefaultClassMeetingConfigMutationDocument);

  const handleSetDefault = useCallback(
    async (id: string) => {
      try {
        await setDefault({ variables: { id } });
        await refetch();
      } catch {
        setErrorMessage(tManager.saveError);
      }
    },
    [setDefault, refetch, tManager, setErrorMessage]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteConfig({ variables: { id: deleteId } });
      setDeleteId(null);
      await refetch();
    } catch {
      setErrorMessage(tManager.deleteError);
    }
  }, [deleteId, deleteConfig, refetch, tManager, setDeleteId, setErrorMessage]);

  return { deleting, settingDefault, handleSetDefault, handleDelete };
}

export function useMeetingConfigRetry(
  refetch: () => Promise<unknown>,
  setErrorMessage: (msg: string | null) => void,
  tManager: MeetingConfigManagerLabels
) {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryMutation] = useMutation(updateClassMeetingConfigMutationDocument);

  const handleRetry = useCallback(
    async (id: string) => {
      setRetryingId(id);
      try {
        await retryMutation({
          variables: { id, input: { details: null, isDefault: null, label: null, password: null, providerId: null } },
        });
        await refetch();
      } catch {
        setErrorMessage(tManager.saveError);
      } finally {
        setRetryingId(null);
      }
    },
    [retryMutation, refetch, tManager, setErrorMessage]
  );

  return { retryingId, handleRetry };
}
