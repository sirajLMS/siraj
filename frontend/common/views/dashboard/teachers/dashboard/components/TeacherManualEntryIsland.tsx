"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useEffect } from "react";
import type { ClassType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createTeacherManualClassEntryMutationDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher-dashboard.documents";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

interface TeacherManualEntryIslandProps {
  readonly labels: TeacherDashboardViewLabels;
}

/**
 * Owns the manual-class-entry creation mutation and registers
 * `onManualEntryOpen`, `onNewSession`, `onManualEntryClose`, and
 * `onManualEntrySubmit` on the shared store. The dialog open / default mode
 * flags live in the store (`manualEntryOpen`, `manualEntryDefaultActive`) so
 * tier switching never loses the modal midpoint state.
 */
export function TeacherManualEntryIsland({ labels }: Readonly<TeacherManualEntryIslandProps>) {
  const teacherIdNotFoundMessage = labels.manualClassEntry.teacherIdNotFound;
  const teacherId = useTeacherDashboardStore(state => state.data.teacherId);
  const setManualEntryOpen = useTeacherDashboardStore(state => state.setManualEntryOpen);
  const setManualEntryDefaultActive = useTeacherDashboardStore(state => state.setManualEntryDefaultActive);
  const setHandlers = useTeacherDashboardStore(state => state.setHandlers);

  const [createManualEntry] = useMutation(createTeacherManualClassEntryMutationDocument);

  const refetch = useCallback(() => {
    const refetchHandler = useTeacherDashboardStore.getState().handlers.refetch;
    if (refetchHandler) {
      void refetchHandler();
    }
  }, []);

  const handleManualEntryOpen = useCallback(() => {
    setManualEntryDefaultActive(false);
    setManualEntryOpen(true);
  }, [setManualEntryDefaultActive, setManualEntryOpen]);

  const handleNewSession = useCallback(() => {
    setManualEntryDefaultActive(true);
    setManualEntryOpen(true);
  }, [setManualEntryDefaultActive, setManualEntryOpen]);

  const handleManualEntryClose = useCallback(() => {
    setManualEntryOpen(false);
  }, [setManualEntryOpen]);

  const handleManualEntrySubmit = useCallback(
    async (data: {
      readonly studentId: string;
      readonly subjectId: string;
      readonly scheduledStartAt: string;
      readonly scheduledEndAt: string;
      readonly durationMinutes: number;
      readonly classType: string;
    }) => {
      if (!teacherId) {
        throw new Error(teacherIdNotFoundMessage);
      }
      await createManualEntry({
        variables: {
          input: {
            studentId: data.studentId,
            teacherId,
            subjectId: data.subjectId,
            scheduledStartAt: data.scheduledStartAt,
            scheduledEndAt: data.scheduledEndAt,
            durationMinutes: data.durationMinutes,
            classType: data.classType as unknown as ClassType | null,
          },
        },
      });
      refetch();
    },
    [createManualEntry, refetch, teacherId, teacherIdNotFoundMessage]
  );

  useEffect(() => {
    setHandlers({
      onManualEntryOpen: handleManualEntryOpen,
      onNewSession: handleNewSession,
      onManualEntryClose: handleManualEntryClose,
      onManualEntrySubmit: handleManualEntrySubmit,
    });
  }, [handleManualEntryOpen, handleNewSession, handleManualEntryClose, handleManualEntrySubmit, setHandlers]);

  return null;
}
