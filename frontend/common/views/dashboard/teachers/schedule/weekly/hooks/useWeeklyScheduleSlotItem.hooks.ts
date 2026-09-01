// Shared per-slot state + derivations lifted out of the byte-identical blocks in
// the tier files `weeklyScheduleGrid.desktop.tsx` (SlotItem) and
// `mobileScheduleList.mobile.tsx` (MobileSlotItem). Both tier components now
// consume this single hook; labels and the remove handler arrive via parameters
// (tier views must not call useAppTranslation themselves).
import type { MouseEvent } from "react";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import {
  isTerminalClassInstance,
  resolveWeeklyScheduleSlotStatus,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks/useWeeklyScheduleGrid.hooks";
import type { ScheduledClass } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";

export interface WeeklyScheduleSlotItemState {
  readonly classInstanceId: string;
  readonly deleteDialogOpen: boolean;
  readonly subjectLabel: string;
  readonly statusLabel: string;
  readonly canJoin: boolean;
  readonly isTerminal: boolean;
  readonly showDelete: boolean;
  readonly closeDeleteConfirm: () => void;
  readonly handleDeleteDialogConfirm: () => void;
  readonly handleDeleteClick: (event: MouseEvent) => void;
}

export function useWeeklyScheduleSlotItem(
  classItem: ScheduledClass,
  labels: TeacherWeeklyScheduleLabels,
  onRemove: (id: string) => void
): WeeklyScheduleSlotItemState {
  const deleteConfirmClassInstanceId = useWeeklyScheduleStore(state => state.deleteConfirmClassInstanceId);
  const openDeleteConfirm = useWeeklyScheduleStore(state => state.openDeleteConfirm);
  const closeDeleteConfirm = useWeeklyScheduleStore(state => state.closeDeleteConfirm);
  const confirmDeleteClassInstance = useWeeklyScheduleStore(state => state.confirmDeleteClassInstance);
  const classInstanceId = classItem.id ?? "";
  const deleteDialogOpen = deleteConfirmClassInstanceId !== null && deleteConfirmClassInstanceId === classInstanceId;
  const subjectLabel = classItem.subjectName?.trim() ?? labels.grid.unknownSubject;
  const statusLabel = resolveWeeklyScheduleSlotStatus(classItem, labels.grid.status);

  const canJoin = isJoinableClassInstance(classItem.executionState, classItem.outcome, {
    isFrozen: classItem.isFrozen ?? false,
  });
  const isTerminal = isTerminalClassInstance(classItem.executionState, classItem.outcome);
  const showDelete = !classItem.isFrozen && !isTerminal;

  const handleDeleteDialogConfirm = () => {
    const confirmedId = confirmDeleteClassInstance();
    if (confirmedId !== null) {
      onRemove(confirmedId);
    }
  };

  const handleDeleteClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openDeleteConfirm(classInstanceId);
  };

  return {
    classInstanceId,
    deleteDialogOpen,
    subjectLabel,
    statusLabel,
    canJoin,
    isTerminal,
    showDelete,
    closeDeleteConfirm,
    handleDeleteDialogConfirm,
    handleDeleteClick,
  };
}
