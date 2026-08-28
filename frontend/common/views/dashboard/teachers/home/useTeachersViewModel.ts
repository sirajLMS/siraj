"use client";

import { useQuery } from "@apollo/client/react";
import {
  AppPermission,
  type TeacherDirectoryQuery_teacherDirectory_metrics as TeacherDirectoryMetrics,
  type TeacherDirectoryQuery_teacherDirectory_rows as TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { teacherDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useTeacherDirectoryStore } from "@/frontend/common/stores/teacherDirectoryStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

export interface TeachersViewModel {
  readonly labels: TeachersDirectoryLabels;
  readonly metrics: TeacherDirectoryMetrics | null | undefined;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly totalTeachers: number;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly canCreateTeacher: boolean;
}

export type UseTeachersViewModelProps = Record<string, never>;

export function useTeachersViewModel(_props: Readonly<UseTeachersViewModelProps> = {}): TeachersViewModel {
  const labels = useAppTranslation(Translation.Dashboard.TeachersDirectory);
  const { searchQuery, setSearchQuery, page, pageSize, setPage } = useTeacherDirectoryStore();
  const { hasPermission } = useUserStore();

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

  const canCreateTeacher = hasPermission(AppPermission.TeachersCreate);

  return {
    labels,
    metrics: directory?.metrics ?? null,
    rows: directory?.rows ?? [],
    totalTeachers: directory?.totalTeachers ?? 0,
    searchQuery,
    onSearchChange: setSearchQuery,
    page,
    pageSize,
    totalCount: directory?.pageInfo?.total ?? 0,
    onPageChange: setPage,
    canCreateTeacher,
  };
}
