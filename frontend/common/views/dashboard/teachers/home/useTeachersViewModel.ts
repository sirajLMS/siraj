"use client";

import { useQuery } from "@apollo/client/react";
import type {
  TeacherDirectoryMetrics,
  TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { teacherDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useTeacherDirectoryStore } from "@/frontend/common/stores/teacherDirectoryStore";

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
}

export type UseTeachersViewModelProps = Record<string, never>;

export function useTeachersViewModel(_props: Readonly<UseTeachersViewModelProps> = {}): TeachersViewModel {
  const { searchQuery, setSearchQuery, page, pageSize, setPage } = useTeacherDirectoryStore();

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
  };
}
