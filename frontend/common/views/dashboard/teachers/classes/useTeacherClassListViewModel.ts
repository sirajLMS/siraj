"use client";

import { useQuery } from "@apollo/client/react";
import type { TeacherAssignedClassesQuery_teacherAssignedClasses_TeacherAssignedClassesResult_rows_TeacherAssignedClass } from "@/frontend/common/graphql/generated/gql/operations";
import { teacherAssignedClassesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useRouter } from "@/shared/i18n/navigation";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * TeacherClassList ViewModel.
 *
 * Pulls the assigned-classes list via `useQuery` and exposes the localized
 * labels, the locale (used to format each row's schedule), and the
 * `handleViewClassAudit` router navigation handler. Both tier views consume
 * the same flat shape; no viewport logic lives here. The `error` field is
 * typed as `unknown` because Apollo Client v4's `useQuery` returns an opaque
 * error union; tier views only treat it as a truthy failure flag.
 */

type TeacherClassRow =
  TeacherAssignedClassesQuery_teacherAssignedClasses_TeacherAssignedClassesResult_rows_TeacherAssignedClass;

export interface TeacherClassListViewModel {
  readonly rows: readonly TeacherClassRow[];
  readonly loading: boolean;
  readonly error: unknown;
  readonly labels: TeacherClassListLabels;
  readonly locale: string;
  readonly handleViewClassAudit: (id: string) => void;
}

export interface TeacherClassListLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly noClasses: string;
  readonly viewDetails: string;
  readonly viewClassAudit: string;
  readonly joinVideo: string;
  readonly durationMinutes: (minutes: number) => string;
  readonly failedToLoad: string;
  readonly statusLabels: {
    readonly PENDING: string;
    readonly TAKEN: string;
    readonly ABSENT: string;
    readonly LEAVE: string;
    readonly NOT_ACTIVATED: string;
    readonly ACTIVATED: string;
    readonly RUNNING: string;
    readonly COMPLETED: string;
    readonly ON_DEMAND_CONFLICT_HELD: string;
    readonly ON_DEMAND_NO_CREDITS_ABSENT: string;
    readonly ON_DEMAND_NO_CREDITS_CANCELLED: string;
    readonly ON_DEMAND_PENDING_CREDITS: string;
  };
}

export type UseTeacherClassListViewModelProps = Record<string, never>;

/** Formats a class's scheduled start/end timestamps as a localized range. */
export function formatClassSchedule(
  scheduledStartAt: string | null | undefined,
  scheduledEndAt: string | null | undefined,
  locale: string
): string {
  if (!scheduledStartAt) {
    return "";
  }
  const start = new Date(scheduledStartAt);
  const datePart = start.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timePart = start.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!scheduledEndAt) {
    return `${datePart} · ${timePart}`;
  }
  const end = new Date(scheduledEndAt);
  const endTime = end.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart} – ${endTime}`;
}

/** Shared helper exposed to tier views so they don't compute this inline. */
export function isRowJoinable(row: TeacherClassRow): boolean {
  return isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false });
}

export function useTeacherClassListViewModel(
  _props: Readonly<UseTeacherClassListViewModelProps> = {}
): TeacherClassListViewModel {
  const t = useAppTranslation(Translation.Dashboard.TeacherClassList);
  const locale = useAppLocale();
  const router = useRouter();
  const { data, loading, error } = useQuery(teacherAssignedClassesQueryDocument);
  const rows = data?.teacherAssignedClasses?.rows ?? [];

  const handleViewClassAudit = (id: string) => {
    router.push(`/classes/${id}/audit`);
  };

  return {
    rows,
    loading,
    error,
    locale,
    handleViewClassAudit,
    labels: {
      pageTitle: t.pageTitle,
      pageSubtitle: t.pageSubtitle,
      noClasses: t.noClasses,
      viewDetails: t.viewDetails,
      viewClassAudit: t.viewClassAudit,
      joinVideo: t.joinVideo,
      durationMinutes: t.durationMinutes,
      failedToLoad: t.errors.failedToLoad,
      statusLabels: t.statusLabels,
    },
  };
}
