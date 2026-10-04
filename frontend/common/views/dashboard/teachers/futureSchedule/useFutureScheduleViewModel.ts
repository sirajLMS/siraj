"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect } from "react";
import type { TeacherFutureScheduleQuery_teacherFutureSchedule_classes as FutureClass } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  logTeacherSupportRequestMutationDocument,
  teacherFutureScheduleQueryDocument,
  updateSessionStatusLeaveMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useFutureScheduleDateStore } from "@/frontend/common/stores/futureScheduleDateStore";
import type {
  ImportantNoteItem,
  SupportContactData,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import type { FutureScheduleLabelsBySection } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types/futureScheduleViewModel.types";
import {
  createRequestLeaveHandler,
  createSupportContactHandler,
  deriveClassDates,
  deriveFutureClasses,
  deriveImportantNotes,
  deriveSupportContact,
  type FutureScheduleToast,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel.helpers";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * FutureSchedule ViewModel.
 *
 * The container owns the data fetching and mutations. It passes a flat prop
 * bag to this hook, which exposes the same interface for both tiers and
 * derives all tier-agnostic presenter values. No viewport logic lives here.
 * All mutable UI state (selectedDate) already lives in the
 * `useFutureScheduleDateStore` Zustand store.
 */

export interface FutureScheduleViewModel {
  readonly classes: readonly FutureClass[];
  readonly leaveQuotaUsed: number;
  readonly leaveQuotaTotal: number;
  readonly totalClasses: number;
  readonly onRequestLeave: (classInstanceId: string) => Promise<void>;
  readonly selectedDate: string;
  readonly onDateChange: (date: string) => void;
  readonly notes: readonly ImportantNoteItem[];
  readonly contact: SupportContactData | null;
  readonly classDates: readonly string[];
  readonly loading: boolean;
  readonly error: unknown;
  /** Records a teacher's support request and toasts the outcome. */
  readonly onSupportContact: () => Promise<void>;
  readonly labelsBySection: FutureScheduleLabelsBySection;
}

export type UseFutureScheduleViewModelProps = {
  readonly teacherId: string;
};

export function useFutureScheduleViewModel(props: Readonly<UseFutureScheduleViewModelProps>): FutureScheduleViewModel {
  const { teacherId } = props;
  const t = useAppTranslation(Translation.Dashboard.TeacherFutureSchedule);
  const notifications = useNotifications();
  useDocumentTitle(null, Translation.Dashboard.TeacherFutureSchedule, "pageTitle");
  const showToast: FutureScheduleToast = (message, severity) => notifications.show(message, { severity });

  const { data, loading, error, refetch } = useQuery(teacherFutureScheduleQueryDocument, {
    variables: { teacherId },
  });

  const [requestLeave] = useMutation(updateSessionStatusLeaveMutationDocument);
  const [logSupportRequest] = useMutation(logTeacherSupportRequestMutationDocument);

  const selectedDate = useFutureScheduleDateStore(s => s.selectedDate);
  const setSelectedDate = useFutureScheduleDateStore(s => s.setSelectedDate);
  const ensureSelectedDate = useFutureScheduleDateStore(s => s.ensureSelectedDate);

  useEffect(() => {
    ensureSelectedDate();
  }, [ensureSelectedDate]);

  const schedule = data?.teacherFutureSchedule;

  const classes = deriveFutureClasses(schedule);
  const notes = deriveImportantNotes(schedule);
  const contact = deriveSupportContact(schedule);
  const classDates = deriveClassDates(classes);
  const handleRequestLeave = createRequestLeaveHandler({ requestLeave, refetch, showToast, labels: t });
  const handleSupportContact = createSupportContactHandler({ logSupportRequest, showToast, labels: t });

  return {
    classes,
    leaveQuotaUsed: schedule?.leaveQuotaUsed ?? 0,
    leaveQuotaTotal: schedule?.leaveQuotaTotal ?? 0,
    totalClasses: schedule?.totalClasses ?? 0,
    onRequestLeave: handleRequestLeave,
    selectedDate,
    onDateChange: setSelectedDate,
    notes,
    contact,
    classDates,
    loading,
    error,
    onSupportContact: handleSupportContact,
    labelsBySection: {
      schedule: t,
      supportContact: {
        supportContact: t.supportContact,
        contactAdmin: t.contactAdmin,
      },
    },
  };
}
