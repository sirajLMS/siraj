"use client";

import { createContext, useContext } from "react";
import type { ClassExecutionState, Gender, StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/graphql/types/meeting-class-config.operations";

export type StudentProfileClassHistorySession = {
  readonly id: string | null;
  readonly title: string | null;
  readonly time: string | null;
  readonly duration: number | null;
  readonly status: string | null;
  readonly outcome?: string | null;
  readonly instructor: string | null;
  readonly timeSlot: string | null;
  readonly room: string | null;
  readonly notes: string | null;
  readonly dayOfMonth: number | null;
  readonly meetingJoinUrl: string | null;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
};

export type StudentProfileQueryData = {
  readonly id: string;
  readonly name: string;
  readonly status: StudentStatus | null;
  readonly avatarUrl: string | null;
  readonly dateOfBirth: string | null;
  readonly gender: Gender | null;
  readonly language: string | null;
  readonly parentId: string | null;
  readonly parentUserId: string | null;
  readonly parentName: string | null;
  readonly isAssociatedViewer: boolean | null;
  readonly primaryTeacherId: string | null;
  readonly teacherUserId: string | null;
  readonly teacherName: string | null;
  readonly hoursPerWeek: number | null;
  readonly classesRemaining: number | null;
  readonly classesTotal: number | null;
  readonly version: number | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly upcomingClasses: {
    readonly id: string | null;
    readonly studentId: string | null;
    readonly studentName: string | null;
    readonly status: StudentStatus | null;
    readonly classes: Array<{
      readonly id: string | null;
      readonly instructor: string | null;
      readonly teacherId: string | null;
      readonly scheduledStartAt: string | null;
      readonly scheduledEndAt: string | null;
      readonly durationMinutes: number | null;
      readonly executionState: ClassExecutionState | null;
      readonly isFrozen: boolean | null;
      readonly meetingJoinUrl: string | null;
      readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
    }> | null;
  } | null;
  readonly classHistory: {
    readonly id: string | null;
    readonly studentName: string | null;
    readonly metrics: {
      readonly totalClasses: number | null;
      readonly attendanceRate: number | null;
      readonly hoursStudied: number | null;
      readonly performance: number | null;
    } | null;
    readonly sessions: readonly StudentProfileClassHistorySession[] | null;
  } | null;
};

type StudentProfileContextValue = {
  readonly studentId: string;
  readonly profile: StudentProfileQueryData | null | undefined;
  readonly loading: boolean;
  readonly refetch: () => Promise<unknown>;
};

const StudentProfileContext = createContext<StudentProfileContextValue | null>(null);

export function StudentProfileProvider({
  value,
  children,
}: {
  readonly value: StudentProfileContextValue;
  readonly children: React.ReactNode;
}) {
  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}

export function useStudentProfileContext(): StudentProfileContextValue | null {
  return useContext(StudentProfileContext);
}
