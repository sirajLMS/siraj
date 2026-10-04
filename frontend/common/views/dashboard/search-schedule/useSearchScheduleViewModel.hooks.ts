"use client";

import { NetworkStatus } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { AvailabilitySearchInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type {
  SearchScheduleDraftFilters,
  SearchScheduleMonthDrawerTeacher,
} from "@/frontend/common/stores/searchScheduleStore";
import { buildTeacherMonthAvailabilityInput } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import type { TeacherAvailabilityGapItem } from "@/frontend/common/views/dashboard/search-schedule/types";
import { EMPTY_INPUT } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.constants";
import { adaptResultItemToStoreTeacher } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.helpers";
import type { SearchScheduleResultItem } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.types";
import {
  formatIsoDate,
  groupGapsByDayOfMonth,
  parseIsoDate,
} from "@/frontend/common/views/dashboard/search-schedule/utils";

export function useSearchScheduleMainQuery(activeInput: AvailabilitySearchInput | null) {
  const { data, loading, error, networkStatus, previousData } = useQuery(searchTeacherAvailabilityQueryDocument, {
    variables: activeInput ? { input: activeInput } : { input: EMPTY_INPUT },
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

  const searchResult = displayData?.searchTeacherAvailability;
  const pageInfo = searchResult?.pageInfo;
  const teacherCount = searchResult?.teachers?.length ?? 0;
  const showPaginationFooter = Boolean(pageInfo && (pageInfo.total ?? 0) > 0);

  return {
    data,
    error,
    isInitialLoading,
    isRefetching,
    searchResult,
    pageInfo,
    teacherCount,
    showPaginationFooter,
  };
}

interface UseSearchScheduleMonthDrawerParams {
  draft: SearchScheduleDraftFilters;
  activeFromDate: string;
  monthDrawerOpen: boolean;
  monthDrawerTeacher: SearchScheduleMonthDrawerTeacher | null;
  monthDrawerCurrentMonthIso: string;
  monthDrawerAnchorFromDate: string;
  openMonthDrawer: (teacher: SearchScheduleMonthDrawerTeacher, anchorFromDate: string) => void;
  closeMonthDrawer: () => void;
  setMonthDrawerCurrentMonth: (isoMonth: string) => void;
}

export function useSearchScheduleMonthDrawer(params: UseSearchScheduleMonthDrawerParams) {
  const {
    draft,
    activeFromDate,
    monthDrawerOpen,
    monthDrawerTeacher,
    monthDrawerCurrentMonthIso,
    monthDrawerAnchorFromDate,
    openMonthDrawer,
    closeMonthDrawer,
    setMonthDrawerCurrentMonth,
  } = params;
  const monthDrawerCurrentDate = useMemo(() => {
    if (!monthDrawerCurrentMonthIso) {
      // Fall back to the anchor date or today when no month has been navigated yet.
      const fallback = monthDrawerAnchorFromDate || activeFromDate || formatIsoDate(new Date());
      return parseIsoDate(fallback);
    }
    return parseIsoDate(monthDrawerCurrentMonthIso);
  }, [monthDrawerCurrentMonthIso, monthDrawerAnchorFromDate, activeFromDate]);

  const monthDrawerInput = useMemo((): AvailabilitySearchInput | null => {
    const teacher = monthDrawerTeacher;
    if (!teacher?.id || !teacher.name) {
      return null;
    }

    // Adapt the minimal store shape into the SearchScheduleTeacherOption that buildTeacherMonthAvailabilityInput expects.
    return buildTeacherMonthAvailabilityInput(draft, { id: teacher.id, name: teacher.name }, monthDrawerCurrentDate);
  }, [draft, monthDrawerCurrentDate, monthDrawerTeacher]);

  const {
    data: monthDrawerData,
    loading: monthDrawerLoading,
    error: monthDrawerError,
  } = useQuery(searchTeacherAvailabilityQueryDocument, {
    variables: monthDrawerInput ? { input: monthDrawerInput } : { input: EMPTY_INPUT },
    skip: !monthDrawerOpen || monthDrawerInput === null,
    fetchPolicy: "cache-and-network",
  });

  const monthDrawerResultItem: SearchScheduleResultItem | null = useMemo(() => {
    const teachers = monthDrawerData?.searchTeacherAvailability?.teachers ?? [];
    const teacherId = monthDrawerTeacher?.id;
    const matchedById = teacherId ? teachers.find(item => item?.id === teacherId) : null;
    return matchedById ?? teachers[0] ?? null;
  }, [monthDrawerData?.searchTeacherAvailability?.teachers, monthDrawerTeacher?.id]);

  const monthDrawerGaps = (monthDrawerResultItem?.gaps ?? null) as
    | readonly (TeacherAvailabilityGapItem | null)[]
    | null
    | undefined;

  const monthDrawerDaysByDate = useMemo(
    () => groupGapsByDayOfMonth(monthDrawerGaps, monthDrawerCurrentDate),
    [monthDrawerGaps, monthDrawerCurrentDate]
  );

  const onOpenMonthDrawer = (teacher: SearchScheduleResultItem, anchorFromDate: string) => {
    // Adapt SearchScheduleResultItem → the minimal persisted store shape.
    openMonthDrawer(adaptResultItemToStoreTeacher(teacher), anchorFromDate);
  };

  const onCloseMonthDrawer = () => closeMonthDrawer();

  const onMonthDrawerChangeMonth = (next: Date) => {
    setMonthDrawerCurrentMonth(formatIsoDate(next));
  };

  return {
    monthDrawerCurrentDate,
    monthDrawerResultItem,
    monthDrawerLoading,
    monthDrawerError,
    monthDrawerDaysByDate,
    onOpenMonthDrawer,
    onCloseMonthDrawer,
    onMonthDrawerChangeMonth,
  };
}
