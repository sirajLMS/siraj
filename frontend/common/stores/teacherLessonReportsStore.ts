"use client";

import { create } from "zustand";
import type { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";

type LessonReportStatusValue = `${LessonReportStatus}`;

/** Filter value for the teacher lesson reports history list (`ALL` shows every status). */
export type TeacherLessonReportStatusFilter = "ALL" | LessonReportStatusValue;

export const TEACHER_LESSON_REPORTS_DEFAULT_STATUS_FILTER: TeacherLessonReportStatusFilter = "ALL";

interface TeacherLessonReportsState {
  readonly statusFilter: TeacherLessonReportStatusFilter;
  readonly setStatusFilter: (value: TeacherLessonReportStatusFilter) => void;
}

/**
 * In-memory (non-persisted) filter state for the teacher lesson reports view.
 * Survives viewport tier switches and SPA navigation; resets on full page reload.
 */
export const useTeacherLessonReportsStore = create<TeacherLessonReportsState>(set => ({
  statusFilter: TEACHER_LESSON_REPORTS_DEFAULT_STATUS_FILTER,
  setStatusFilter: value => set({ statusFilter: value }),
}));
