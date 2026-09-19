"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { studentClassesRangeQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppLocale, useAppTranslation } from "@/shared/locale";
import { Translation } from "@/shared/locale/namespaces/translation";
import type { StudentWeekCalendarLabels } from "@/shared/locale/types/dashboard/scheduling/student-week-calendar";

export interface StudentClassRow {
  readonly id: string;
  readonly scheduledStartAt: string;
  readonly scheduledEndAt: string;
  readonly subjectName: string | null;
  readonly instructor: string;
  readonly outcome: string;
  readonly executionState: string;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export interface StudentWeekCalendarViewModel {
  readonly labels: StudentWeekCalendarLabels;
  readonly locale: string;
  readonly weekStart: Date;
  readonly goToPreviousWeek: () => void;
  readonly goToNextWeek: () => void;
  readonly goToToday: () => void;
  readonly classes: readonly StudentClassRow[];
  readonly loading: boolean;
  readonly error: boolean;
}

export function useStudentWeekCalendarViewModel(studentId: string): StudentWeekCalendarViewModel {
  const labels = useAppTranslation(Translation.Dashboard.StudentWeekCalendar);
  const locale = useAppLocale();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  const goToPreviousWeek = useCallback(() => setWeekStart(week => addDays(week, -7)), []);
  const goToNextWeek = useCallback(() => setWeekStart(week => addDays(week, 7)), []);
  const goToToday = useCallback(() => setWeekStart(startOfWeek(new Date())), []);

  const weekEnd = addDays(weekStart, 7);
  const { data, loading, error } = useQuery(studentClassesRangeQueryDocument, {
    variables: { studentId, from: weekStart.toISOString(), to: weekEnd.toISOString() },
    fetchPolicy: "cache-and-network",
  });

  const classes: readonly StudentClassRow[] = (data?.studentUpcomingClasses?.classes ?? []).map(cls => ({
    id: cls.id ?? "",
    scheduledStartAt: cls.scheduledStartAt ?? "",
    scheduledEndAt: cls.scheduledEndAt ?? "",
    subjectName: cls.subjectName ?? null,
    instructor: cls.instructor ?? "",
    outcome: cls.outcome ?? "",
    executionState: cls.executionState ?? "",
  }));

  return {
    labels,
    locale,
    weekStart,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    classes,
    loading,
    error: Boolean(error) && !data,
  };
}
