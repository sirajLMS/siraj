"use client";

import { useQuery } from "@apollo/client/react";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import type { StudentByIdQuery, StudentUpcomingClassesQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student.documents";
import { studentUpcomingClassesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-status.documents";
import { canViewStudentProfileTab } from "@/frontend/common/views/dashboard/students/profile/studentProfileTabs";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import type { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/useStudentProfileContext";
import type { StudentStatusPageData } from "@/frontend/common/views/dashboard/students/status/types";
import {
  buildStudentFromProfile,
  buildStudentFromQuery,
} from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel.helpers";
import type { CommonLabels } from "@/shared/locale";

export type QueryResult = {
  readonly studentData: StudentByIdQuery | undefined;
  readonly studentLoading: boolean;
  readonly studentError: unknown;
  readonly upcomingData: StudentUpcomingClassesQuery | undefined;
  readonly upcomingLoading: boolean;
  readonly upcomingError: unknown;
  readonly refetchUpcoming: (() => Promise<unknown> | undefined) | undefined;
};

function useStudentStatusQueries(studentId: string, useUnifiedProfile: boolean): QueryResult {
  const {
    data: studentData,
    loading: studentLoading,
    error: studentError,
  } = useQuery(studentByIdQueryDocument, {
    variables: { studentId },
    skip: !studentId || useUnifiedProfile,
  });

  const {
    data: upcomingData,
    loading: upcomingLoading,
    error: upcomingError,
    refetch: refetchUpcoming,
  } = useQuery(studentUpcomingClassesQueryDocument, {
    variables: { studentId },
    skip: !studentId || useUnifiedProfile,
  });

  return { studentData, studentLoading, studentError, upcomingData, upcomingLoading, upcomingError, refetchUpcoming };
}

type PermissionsResult = {
  readonly canEditStatus: boolean;
  readonly canViewStatus: boolean;
  readonly canViewSchedule: boolean;
  readonly hasTabAccess: boolean;
};

export function useStudentStatusPermissions(): PermissionsResult {
  const { canView, canEdit } = useStudentFieldAccess();
  return {
    canEditStatus: canEdit("student_academic"),
    canViewStatus: canView("student_academic"),
    canViewSchedule: canView("student_schedule"),
    hasTabAccess: canViewStudentProfileTab("status", canView),
  };
}

type DataEnv = {
  readonly studentId: string;
  readonly useUnifiedProfile: boolean;
  readonly profileContext: ReturnType<typeof useStudentProfileContext>;
};

type DataResult = {
  readonly student: StudentStatusPageData | null;
  readonly versionRef: RefObject<number | null>;
  readonly queries: QueryResult;
};

export function useStudentStatusData(env: Readonly<DataEnv>): DataResult {
  const { studentId, useUnifiedProfile, profileContext } = env;
  const queries = useStudentStatusQueries(studentId, useUnifiedProfile);

  const student: StudentStatusPageData | null = useMemo(() => {
    if (useUnifiedProfile) {
      const profile = profileContext?.profile;
      return profile ? buildStudentFromProfile(profile) : null;
    }
    const s = queries.studentData?.studentById;
    if (!s?.id || !s.name) return null;
    return buildStudentFromQuery(s, queries.upcomingData?.studentUpcomingClasses ?? undefined);
  }, [useUnifiedProfile, profileContext?.profile, queries.studentData, queries.upcomingData]);

  const versionRef = useRef<number | null>(student?.version ?? null);
  useEffect(() => {
    versionRef.current = student?.version ?? null;
  }, [student?.version]);

  return { student, versionRef, queries };
}

export function useStudentStatusDerived(env: {
  readonly studentId: string;
  readonly useUnifiedProfile: boolean;
  readonly profileContext: ReturnType<typeof useStudentProfileContext>;
  readonly queries: QueryResult;
  readonly tc: CommonLabels;
}) {
  const { studentId, useUnifiedProfile, profileContext, queries, tc } = env;
  const loading = useUnifiedProfile
    ? Boolean(profileContext?.loading)
    : queries.studentLoading || queries.upcomingLoading;
  const error =
    !studentId || (!useUnifiedProfile && (queries.studentError || queries.upcomingError)) ? tc.loadFailed : null;
  return { loading, error };
}
