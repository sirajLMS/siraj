"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import { useState } from "react";
import type { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  ReassignmentStudentData,
  ReassignmentSubmitInput,
  StatusChangeInput,
  TeacherReassignmentViewProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { useRouter } from "@/shared/i18n/navigation";
import { type CommonLabels, Translation, useAppTranslation } from "@/shared/locale";
import type { TeacherReassignmentLabels } from "@/shared/locale/types/dashboard/teachers/reassignment";

export type UseTeacherReassignmentViewModelProps = TeacherReassignmentViewProps;

export interface TeacherReassignmentCoordinatorLabels {
  readonly labels: TeacherReassignmentLabels;
  readonly common: Pick<CommonLabels, "loadFailed" | "operationFailed">;
}

/** Coordinator-only labels for `TeacherReassignmentContainer` mutations and error UI. */
export function useTeacherReassignmentCoordinatorLabels(): TeacherReassignmentCoordinatorLabels {
  return {
    labels: useAppTranslation(Translation.Dashboard.TeacherReassignment),
    common: useAppTranslation(Translation.Common),
  };
}

export interface TeacherReassignmentViewModel {
  readonly labels: TeacherReassignmentLabels;
  readonly student: ReassignmentStudentData;
  readonly currentTeacherName: string;
  readonly isSubmitting: boolean;
  readonly onReassign: (input: ReassignmentSubmitInput) => Promise<void>;
  readonly onStatusChange: (input: StatusChangeInput) => Promise<void>;
  readonly onCancel: () => void;
  // NEW FOR PLAN v5: form state + actions previously held in tier useState/useNotifications/setTimeout
  // (specs.md §3 N7, N17, N18). Lifted into the ViewModel so the tier component stays pure-render.
  readonly controls: {
    readonly selectedTeacherId: string;
    readonly selectedNewStatus: StudentStatus | "";
    readonly saved: boolean;
    readonly onSelectedTeacherIdChange: (id: string) => void;
    readonly onSelectedNewStatusChange: (status: StudentStatus | "") => void;
    readonly onSubmitForm: (e: React.SyntheticEvent<HTMLFormElement>) => Promise<void>;
  };
  readonly bento: {
    readonly onOpenChangeHistory: () => void;
    readonly onOpenParentContact: () => void;
  };
}

export function useTeacherReassignmentViewModel(
  props: Readonly<UseTeacherReassignmentViewModelProps>
): TeacherReassignmentViewModel {
  const { student, currentTeacherName, isSubmitting, onReassign, onStatusChange, onCancel } = props;

  const t = useAppTranslation(Translation.Dashboard.TeacherReassignment);
  const notifications = useNotifications();
  const router = useRouter();

  // Form state formerly held in `useState` inside the tier components (N7/N17/N18).
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedNewStatus, setSelectedNewStatus] = useState<StudentStatus | "">("");
  const [saved, setSaved] = useState(false);

  const handleSelectedTeacherIdChange = (id: string): void => {
    setSelectedTeacherId(id);
  };

  const handleSelectedNewStatusChange = (status: StudentStatus | ""): void => {
    setSelectedNewStatus(status);
  };

  const handleSubmitForm = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!selectedTeacherId && !selectedNewStatus) {
      // N17: toast side-effects live in the ViewModel, not the tier view.
      notifications.show(t.actions.info, { severity: "warning", autoHideDuration: 4000 });
      return;
    }

    const bothChanged = Boolean(selectedTeacherId) && Boolean(selectedNewStatus);

    if (selectedTeacherId) {
      const input: ReassignmentSubmitInput = {
        studentId: student.id,
        newTeacherId: selectedTeacherId,
        expectedVersion: student.version ?? undefined,
      };
      await onReassign(input);
    }

    if (selectedNewStatus) {
      const input: StatusChangeInput = {
        studentId: student.id,
        newStatus: selectedNewStatus,
        expectedVersion: bothChanged ? undefined : (student.version ?? undefined),
      };
      await onStatusChange(input);
    }

    setSaved(true);
    // N18: setTimeout side-effects live in the ViewModel, not the tier view.
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const handleOpenChangeHistory = (): void => {
    // N8: navigation lives in the ViewModel, not the tier view.
    router.push(studentProfileTabHref(student.id, "history"));
  };

  const handleOpenParentContact = (): void => {
    // N17: toast side-effects live in the ViewModel, not the tier view.
    notifications.show(t.historyAndContact.parentContact, {
      severity: "info",
      autoHideDuration: 4000,
    });
  };

  return {
    labels: t,
    student,
    currentTeacherName,
    isSubmitting,
    onReassign,
    onStatusChange,
    onCancel,
    controls: {
      selectedTeacherId,
      selectedNewStatus,
      saved,
      onSelectedTeacherIdChange: handleSelectedTeacherIdChange,
      onSelectedNewStatusChange: handleSelectedNewStatusChange,
      onSubmitForm: handleSubmitForm,
    },
    bento: {
      onOpenChangeHistory: handleOpenChangeHistory,
      onOpenParentContact: handleOpenParentContact,
    },
  };
}
