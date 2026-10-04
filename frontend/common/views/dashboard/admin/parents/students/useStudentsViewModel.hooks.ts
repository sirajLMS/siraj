import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { StudentDirectoryQuery, StudentFilterArgs } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-directory.documents";
import { studentHref, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import {
  DEFAULT_PAGINATION_ARGS,
  EMPTY_FILTER_ARGS,
} from "@/frontend/common/views/dashboard/admin/parents/students/useStudentsViewModel.constants";
import {
  buildLabelsBySection,
  buildStatusCounts,
  buildStudentRows,
  buildViewMetrics,
} from "@/frontend/common/views/dashboard/admin/parents/students/utils";
import type { useRouter } from "@/shared/i18n/navigation";
import type { StudentDirectoryLabels } from "@/shared/locale";

export function useComputedFilterArgs(
  searchQuery: string,
  filterArgs: StudentFilterArgs | null
): StudentFilterArgs | null {
  return useMemo<StudentFilterArgs | null>(() => {
    if (!searchQuery && !filterArgs) return null;
    return {
      ...EMPTY_FILTER_ARGS,
      ...(filterArgs ? { gender: filterArgs.gender, language: filterArgs.language, status: filterArgs.status } : {}),
      name: (searchQuery || filterArgs?.name) ?? null,
    };
  }, [searchQuery, filterArgs]);
}

export function useStudentDirectoryData(computedFilterArgs: StudentFilterArgs | null, page: number, pageSize: number) {
  return useQuery(studentDirectoryQueryDocument, {
    variables: {
      filterArgs: computedFilterArgs,
      orderBy: null,
      paginationArgs: {
        ...DEFAULT_PAGINATION_ARGS,
        first: pageSize,
        page: page + 1,
      },
    },
    fetchPolicy: "cache-and-network",
  });
}

export function useDerivedStudentData(data: StudentDirectoryQuery | undefined, t: StudentDirectoryLabels) {
  const rows = useMemo(() => buildStudentRows(data), [data]);
  const totalStudents = data ? (data.studentDirectory?.totalCount ?? 0) : undefined;
  const counts = useMemo(() => buildStatusCounts(rows), [rows]);
  const viewMetrics = useMemo(() => buildViewMetrics(counts, t), [counts, t]);
  const labelsBySection = useMemo(() => buildLabelsBySection(t), [t]);
  return { rows, totalStudents, viewMetrics, labelsBySection };
}

export function createStudentHandlers(
  router: ReturnType<typeof useRouter>,
  setFilterPanelOpen: (open: boolean) => void,
  filterPanelOpen: boolean
) {
  const handleViewProfile = (id: string) => {
    router.push(studentHref(id));
  };

  const handleViewHistory = (id: string) => {
    router.push(studentProfileTabHref(id, "history"));
  };

  const handleAddStudent = () => {
    router.push("/students/onboarding");
  };

  const handleFilterClick = () => {
    setFilterPanelOpen(!filterPanelOpen);
  };

  return { handleViewProfile, handleViewHistory, handleAddStudent, handleFilterClick };
}
