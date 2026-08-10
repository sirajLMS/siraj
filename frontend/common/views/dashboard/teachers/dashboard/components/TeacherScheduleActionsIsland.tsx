"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useEffect } from "react";
import {
  activateClassMutationDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  updateSessionStatusStartMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/scheduling/class-session.documents";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import { logger } from "@/frontend/common/utils/logger";

/**
 * Registers the four teacher-session mutation handlers into the shared store
 * on mount so the coordinator can pass them through the ViewModel to tier
 * views, and confirms the lifted "absent dialog" with the captured class id.
 * Self-contained: it owns its own Apollo mutation hooks (the only place in
 * the tree where these four mutations live). After each mutation it invokes
 * the dashboard refetch handler registered by the data island.
 */
export function TeacherScheduleActionsIsland() {
  const absentDialogClassInstanceId = useTeacherDashboardStore(state => state.absentDialogClassInstanceId);
  const setAbsentDialogOpen = useTeacherDashboardStore(state => state.setAbsentDialogOpen);
  const setData = useTeacherDashboardStore(state => state.setData);
  const setHandlers = useTeacherDashboardStore(state => state.setHandlers);

  const [activateClass] = useMutation(activateClassMutationDocument);
  const [startClass] = useMutation(updateSessionStatusStartMutationDocument);
  const [markAbsent] = useMutation(updateSessionStatusAbsentMutationDocument);
  const [requestLeave] = useMutation(updateSessionStatusLeaveMutationDocument);

  const refetch = useCallback(() => {
    const refetchHandler = useTeacherDashboardStore.getState().handlers.refetch;
    if (refetchHandler) {
      void refetchHandler();
    }
  }, []);

  const handleActivate = useCallback(
    async (id: string) => {
      try {
        await activateClass({ variables: { classInstanceId: id } });
        refetch();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error("Error activating class:", err);
        if (message?.includes("missedClassTime") || message?.toLowerCase().includes("missed class time")) {
          setData({ activationError: "missedClassTime" });
        } else {
          setData({ activationError: "activationFailed" });
        }
      }
    },
    [activateClass, refetch, setData]
  );

  const handleStartSession = useCallback(
    async (id: string) => {
      try {
        await startClass({ variables: { classInstanceId: id } });
        refetch();
      } catch (err) {
        logger.error("Error starting session:", err);
      }
    },
    [startClass, refetch]
  );

  const handleMarkAbsent = useCallback(
    async (id: string) => {
      try {
        await markAbsent({ variables: { classInstanceId: id } });
        refetch();
      } catch (err) {
        logger.error("Error marking absent:", err);
      }
    },
    [markAbsent, refetch]
  );

  const handleRequestLeave = useCallback(
    async (id: string) => {
      try {
        await requestLeave({
          variables: { classInstanceId: id, leaveReason: "Teacher requested leave from teacher dashboard" },
        });
        refetch();
      } catch (err) {
        logger.error("Error requesting leave:", err);
      }
    },
    [requestLeave, refetch]
  );

  const handleAbsentDialogConfirm = useCallback(async () => {
    if (absentDialogClassInstanceId) {
      try {
        await markAbsent({ variables: { classInstanceId: absentDialogClassInstanceId } });
        refetch();
      } catch (err) {
        logger.error("Error marking absent from dialog:", err);
      }
    }
    setAbsentDialogOpen(false);
  }, [absentDialogClassInstanceId, markAbsent, refetch, setAbsentDialogOpen]);

  useEffect(() => {
    setHandlers({
      onActivate: handleActivate,
      onStartSession: handleStartSession,
      onMarkAbsent: handleMarkAbsent,
      onRequestLeave: handleRequestLeave,
      onAbsentDialogConfirm: handleAbsentDialogConfirm,
    });
  }, [
    handleActivate,
    handleStartSession,
    handleMarkAbsent,
    handleRequestLeave,
    handleAbsentDialogConfirm,
    setHandlers,
  ]);

  return null;
}
