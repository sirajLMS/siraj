"use client";

import type { FutureClass } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ImportantNoteItem, SupportContactData } from "@/frontend/views/dashboard/teachers/futureSchedule/types";

/**
 * FutureSchedule ViewModel.
 *
 * The container (`FutureScheduleContainer`) owns all data fetching
 * (Apollo `useQuery`/`useMutation`) and side effects. It passes a flat
 * prop bag to this hook. Per the Phase 5 migration plan ("Split +
 * ViewModel + Zustand"), the ViewModel hook exposes the same interface
 * for both tiers and derives any tier-agnostic presenter values. No
 * viewport logic ever lives here. All mutable UI state (selectedDate)
 * already lives in `useFutureScheduleDateStore` Zustand store, so it
 * survives tier switching.
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
}

export type UseFutureScheduleViewModelProps = Omit<FutureScheduleViewModel, "classDates">;

export function useFutureScheduleViewModel(props: Readonly<UseFutureScheduleViewModelProps>): FutureScheduleViewModel {
  const {
    classes,
    leaveQuotaUsed,
    leaveQuotaTotal,
    totalClasses,
    onRequestLeave,
    selectedDate,
    onDateChange,
    notes,
    contact,
  } = props;

  const classDates = classes
    .filter((c: FutureClass) => c.scheduledDate)
    .map((c: FutureClass) => c.scheduledDate as string);

  return {
    classes,
    leaveQuotaUsed,
    leaveQuotaTotal,
    totalClasses,
    onRequestLeave,
    selectedDate,
    onDateChange,
    notes,
    contact,
    classDates,
  };
}
