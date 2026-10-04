"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { studentCreditBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-lms.documents";
import { studentRecentLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import type {
  RecentLessonReportRow,
  StudentCreditBalanceRow,
  UpcomingLessonRow,
} from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import {
  countLessonsToday,
  findNextLesson,
} from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel.helpers";
import {
  mapCreditBalance,
  mapRecentLessonReports,
  mapUpcomingLessons,
} from "@/frontend/common/views/dashboard/student/dashboard/utils/studentDashboardMappers";

interface UseStudentDashboardQueriesState {
  readonly nextLesson: UpcomingLessonRow | null;
  readonly upcomingLessons: readonly UpcomingLessonRow[];
  readonly upcomingTodayCount: number;
  readonly creditBalance: StudentCreditBalanceRow;
  readonly recentLessonReports: readonly RecentLessonReportRow[];
  readonly totalCount: number;
  readonly loading: boolean;
}

export function useStudentDashboardQueries(page: number, pageSize: number): UseStudentDashboardQueriesState {
  const paginationArgs = useMemo(
    () => ({
      page: page + 1,
      first: pageSize,
      skip: null,
      after: null,
      before: null,
      last: null,
      maxCount: null,
    }),
    [page, pageSize]
  );

  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId: null, year: null, month: null, includeUpcomingClasses: true },
    fetchPolicy: "cache-and-network",
  });

  const studentId = profileData?.studentProfile?.id ?? null;

  const { data: balanceData, loading: balanceLoading } = useQuery(studentCreditBalanceQueryDocument, {
    variables: { studentId: studentId ?? "" },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const { data: reportsData, loading: reportsLoading } = useQuery(studentRecentLessonReportsQueryDocument, {
    variables: {
      paginationArgs,
    },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const upcomingLessons: readonly UpcomingLessonRow[] = useMemo(
    () => mapUpcomingLessons(profileData?.studentProfile),
    [profileData]
  );

  const nextLesson = useMemo(() => findNextLesson(upcomingLessons), [upcomingLessons]);
  const upcomingTodayCount = useMemo(() => countLessonsToday(upcomingLessons), [upcomingLessons]);

  const creditBalance: StudentCreditBalanceRow = useMemo(
    () => mapCreditBalance(balanceData?.studentCreditBalance),
    [balanceData]
  );

  const recentLessonReports: readonly RecentLessonReportRow[] = useMemo(
    () => mapRecentLessonReports(reportsData?.studentRecentLessonReports?.rows),
    [reportsData]
  );

  const totalCount = reportsData?.studentRecentLessonReports?.totalCount ?? 0;
  const loading = profileLoading || balanceLoading || reportsLoading;

  return { nextLesson, upcomingLessons, upcomingTodayCount, creditBalance, recentLessonReports, totalCount, loading };
}
