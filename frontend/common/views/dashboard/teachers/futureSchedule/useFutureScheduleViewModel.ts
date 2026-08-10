"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import type { FutureClass } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  logTeacherSupportRequestMutationDocument,
  teacherFutureScheduleQueryDocument,
  updateSessionStatusLeaveMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useFutureScheduleDateStore } from "@/frontend/common/stores/futureScheduleDateStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  ImportantNoteItem,
  SupportContactData,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import type { FutureScheduleLabelsBySection } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types/futureScheduleViewModel.types";
import { Translation, useAppTranslation } from "@/shared/locale";
import { getErrorMessage } from "@/shared/utils/error";

/**
 * FutureSchedule ViewModel.
 *
 * The container owns the data fetching and mutations. It passes a flat
 * prop bag to this hook. Per the Phase 5 migration plan, the ViewModel hook
 * exposes the same interface for both tiers and derives any tier-agnostic
 * presenter values. No viewport logic lives here. All mutable UI state
 * (selectedDate) already lives in `useFutureScheduleDateStore` Zustand store.
 */

const EMPTY_CLASSES: readonly FutureClass[] = [];

function isFutureClass(value: unknown): value is FutureClass {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value) && "id" in value && "scheduledDate" in value
  );
}

function isFutureClassArray(value: unknown): value is FutureClass[] {
  return Array.isArray(value) && value.every(isFutureClass);
}

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
  // NEW FOR PLAN v5: lifted support-contact action (previously owned inline
  // by the tier-side `supportContact.{mobile,desktop}.tsx` via
  // `useMutation(logTeacherSupportRequestMutationDocument)` +
  // `useNotifications()` per specs.md §3 N1 + N17 + §6.2).
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

  const { data, loading, error, refetch } = useQuery(teacherFutureScheduleQueryDocument, {
    variables: { teacherId },
  });

  const [requestLeave] = useMutation(updateSessionStatusLeaveMutationDocument);
  // NEW FOR PLAN v5: lifted support-contact mutation out of the tier-side
  // `supportContact.{mobile,desktop}.tsx` files (specs.md §3 N1 + N17).
  const [logSupportRequest] = useMutation(logTeacherSupportRequestMutationDocument);

  const selectedDate = useFutureScheduleDateStore(s => s.selectedDate);
  const setSelectedDate = useFutureScheduleDateStore(s => s.setSelectedDate);

  const schedule = data?.teacherFutureSchedule;

  const handleRequestLeave = async (classInstanceId: string) => {
    try {
      await requestLeave({
        variables: {
          classInstanceId,
          leaveReason: t.defaultLeaveReason,
        },
      });
      await refetch();
      notifications.show(t.notifications.leaveRequested, { severity: "success" });
    } catch (err) {
      const message = getErrorMessage(err);
      logger.error({ caller: "FutureScheduleContainer" }, `Leave request failed: ${message}`);
      if (message.includes("quota") || message.includes("Leave quota exceeded")) {
        notifications.show(t.errors.quotaExceeded, { severity: "error" });
      } else {
        notifications.show(message || t.errors.leaveRequestFailed, { severity: "error" });
      }
    }
  };

  const rawClasses = schedule?.classes ?? [];
  const classes: readonly FutureClass[] = isFutureClassArray(rawClasses) ? rawClasses : EMPTY_CLASSES;
  const notes: ImportantNoteItem[] = (schedule?.importantNotes ?? []).map(n => ({
    id: n.id ?? "",
    title: n.title ?? "",
    body: n.body,
    priority: n.priority,
    startsAt: n.startsAt,
    expiresAt: n.expiresAt,
  }));
  const contact: SupportContactData | null = schedule?.supportContact
    ? {
        id: schedule.supportContact.id,
        name: schedule.supportContact.name,
        role: schedule.supportContact.role,
        avatarUrl: schedule.supportContact.avatarUrl,
        phone: schedule.supportContact.phone,
      }
    : null;

  const classDates = classes
    .filter((c): c is FutureClass & { scheduledDate: string } => c.scheduledDate !== null)
    .map(c => c.scheduledDate);

  // NEW FOR PLAN v5: lifted support-contact action (previously owned inline
  // by the tier-side `supportContact.{mobile,desktop}.tsx` files). Performs
  // the `logTeacherSupportRequest` mutation and surfaces success/failure
  // via the `useNotifications` toast side-effect — neither of which lives
  // in tier per specs.md §3 N1 + N17 + §6.2.
  const handleSupportContact = async () => {
    try {
      await logSupportRequest({
        variables: {
          input: { reason: t.supportRequestReason },
        },
      });
      notifications.show(t.notifications.supportRequestSent, { severity: "success" });
    } catch {
      notifications.show(t.errors.supportRequestFailed, { severity: "error" });
    }
  };

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
