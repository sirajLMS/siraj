"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback } from "react";
import type {
  TeacherDirectoryMetrics,
  TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { teacherDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useTeacherDirectoryStore } from "@/frontend/common/stores/teacherDirectoryStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { useRouter } from "@/shared/i18n/routing";

export interface TeachersViewModel {
  readonly metrics: TeacherDirectoryMetrics | null | undefined;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly totalTeachers: number;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  // NEW FOR PLAN v5: per-row navigation callbacks lifted out of the tier
  // TeacherCardList / TeacherDataGrid files (specs §6.2 + §3 N8 — `useRouter`
  // belongs in the ViewModel, not in the tier views).
  readonly onNavigateToSchedule: (teacherId: string) => void;
  readonly onNavigateToProfile: (teacher: TeacherDirectoryRow) => void;
  // NEW FOR PLAN v5: `canCreateTeacher` gate-prop lifted out of the tier
  // teachersView.{mobile,desktop}.tsx files (specs §6.1 + §3 N3 —
  // `RequirePermission` belongs in the Container; the tier views gate on
  // this boolean instead).
  readonly canCreateTeacher: boolean;
}

export type UseTeachersViewModelProps = Record<string, never>;

export function useTeachersViewModel(_props: Readonly<UseTeachersViewModelProps> = {}): TeachersViewModel {
  const { searchQuery, setSearchQuery, page, pageSize, setPage } = useTeacherDirectoryStore();
  const { hasPermission } = useUserStore();
  const router = useRouter();

  const { data } = useQuery(teacherDirectoryQueryDocument, {
    variables: {
      search: searchQuery || null,
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        skip: null,
        after: null,
        before: null,
        last: null,
        maxCount: null,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const directory = data?.teacherDirectory;

  // NEW FOR PLAN v5: navigation handlers owned by the ViewModel — the tier
  // views now call these callbacks instead of `router.push(...)` directly.
  const onNavigateToSchedule = useCallback(
    (teacherId: string) => {
      router.push(`/teachers/${teacherId}/schedule/weekly`);
    },
    [router]
  );

  const onNavigateToProfile = useCallback(
    (teacher: TeacherDirectoryRow) => {
      const href = profileHrefForTeacher({ userId: teacher.userId, teacherId: teacher.id });
      if (href) {
        router.push(href);
      }
    },
    [router]
  );

  const canCreateTeacher = hasPermission(AppPermission.TeachersCreate);

  return {
    metrics: directory?.metrics ?? null,
    rows: directory?.rows ?? [],
    totalTeachers: directory?.totalTeachers ?? 0,
    searchQuery,
    onSearchChange: setSearchQuery,
    page,
    pageSize,
    totalCount: directory?.pageInfo?.total ?? 0,
    onPageChange: setPage,
    onNavigateToSchedule,
    onNavigateToProfile,
    canCreateTeacher,
  };
}
