"use client";

import { useQuery } from "@apollo/client/react";
import { NetworkStatus } from "@apollo/client";
import { useEffect, useMemo } from "react";
import { AppPermission, type AvailabilitySearchInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useSearchScheduleStore } from "@/frontend/common/stores/searchScheduleStore";

export interface SearchScheduleResultItem {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly gender?: string | null;
  readonly timezone?: string | null;
  readonly availableDaysCount?: number | null;
  readonly gaps?:
    | readonly ({
        readonly id?: string | null;
        readonly teacherId?: string | null;
        readonly teacherName?: string | null;
        readonly teacherGender?: string | null;
        readonly dayOfWeek?: string | null;
        readonly calendarDate?: string | null;
        readonly gapStartTime?: string | null;
        readonly gapEndTime?: string | null;
        readonly timezone?: string | null;
      } | null)[]
    | null;
}

export interface SearchSchedulePageInfo {
  readonly count?: number | null;
  readonly currentPage?: number | null;
  readonly hasMorePages?: boolean | null;
  readonly lastPage?: number | null;
  readonly perPage?: number | null;
  readonly total?: number | null;
}

export interface SearchScheduleResultSummary {
  readonly id?: string | null;
  readonly totalGaps?: number | null;
  readonly totalCount?: number | null;
  readonly pageInfo?: SearchSchedulePageInfo | null;
  readonly teachers?: readonly (SearchScheduleResultItem | null)[] | null;
}

export interface UseSearchScheduleViewModelProps {
  readonly requiredPermission?: AppPermission;
}

export interface SearchScheduleViewModel {
  readonly searchResult: SearchScheduleResultSummary | null | undefined;
  readonly fromDate: string;
  readonly toDate: string;
  readonly isInitialLoading: boolean;
  readonly isRefetching: boolean;
  readonly hasSearched: boolean;
  readonly error: ReturnType<typeof useQuery>["error"];
  readonly pageInfo: SearchSchedulePageInfo | null | undefined;
  readonly teacherCount: number;
  readonly showPaginationFooter: boolean;
  readonly draft: ReturnType<typeof useSearchScheduleStore.getState>["draft"];
  readonly hasHydrated: boolean;
  readonly onDraftChange: (draft: Partial<ReturnType<typeof useSearchScheduleStore.getState>["draft"]>) => void;
  readonly onSearch: () => void;
  readonly onPageChange: (page: number) => void;
  readonly requiredPermission: AppPermission;
}

export function useSearchScheduleViewModel(props?: Readonly<UseSearchScheduleViewModelProps>): SearchScheduleViewModel {
  const requiredPermission = props?.requiredPermission ?? AppPermission.ScheduleSearchAvailability;

  const draft = useSearchScheduleStore(state => state.draft);
  const setDraft = useSearchScheduleStore(state => state.setDraft);
  const activeInput = useSearchScheduleStore(state => state.activeInput);
  const commitSearch = useSearchScheduleStore(state => state.commitSearch);
  const setPage = useSearchScheduleStore(state => state.setPage);
  const hasSearched = useSearchScheduleStore(state => state.hasSearched);
  const hasHydrated = useSearchScheduleStore(state => state._hasHydrated);

  useEffect(() => {
    if (!hasHydrated || hasSearched) {
      return;
    }

    commitSearch();
  }, [commitSearch, hasHydrated, hasSearched]);

  const { data, loading, error, networkStatus, previousData } = useQuery(searchTeacherAvailabilityQueryDocument, {
    variables: activeInput ? { input: activeInput } : { input: {} as AvailabilitySearchInput },
    skip: activeInput === null,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  const displayData = data ?? previousData;
  const isInitialLoading = loading && !displayData;
  const isRefetching =
    loading &&
    !!displayData &&
    (networkStatus === NetworkStatus.refetch || networkStatus === NetworkStatus.setVariables);

  const activeFromDate = useMemo(
    () => activeInput?.fromDate ?? draft.fromDate,
    [activeInput?.fromDate, draft.fromDate]
  );
  const activeToDate = useMemo(() => activeInput?.toDate ?? draft.toDate, [activeInput?.toDate, draft.toDate]);

  const searchResult = displayData?.searchTeacherAvailability;
  const pageInfo = searchResult?.pageInfo;
  const teacherCount = searchResult?.teachers?.length ?? 0;
  const showPaginationFooter = Boolean(pageInfo && (pageInfo.total ?? 0) > 0);

  return {
    searchResult,
    fromDate: activeFromDate,
    toDate: activeToDate,
    isInitialLoading,
    isRefetching,
    hasSearched,
    error,
    pageInfo,
    teacherCount,
    showPaginationFooter,
    draft,
    hasHydrated,
    onDraftChange: setDraft,
    onSearch: commitSearch,
    onPageChange: setPage,
    requiredPermission,
  };
}
