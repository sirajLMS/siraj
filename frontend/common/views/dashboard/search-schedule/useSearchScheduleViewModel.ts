"use client";

import { useEffect, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  useSearchScheduleMainQuery,
  useSearchScheduleMonthDrawer,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.hooks";
import { buildSearchScheduleViewModel } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.parts";
import {
  useSearchScheduleHandlers,
  useSearchScheduleStoreSlice,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.store";
import type {
  SearchScheduleViewModel,
  UseSearchScheduleViewModelProps,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export type {
  SearchSchedulePageInfo,
  SearchScheduleResultItem,
  SearchScheduleResultSummary,
  SearchScheduleViewModel,
  UseSearchScheduleViewModelProps,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.types";

export function useSearchScheduleViewModel(props?: Readonly<UseSearchScheduleViewModelProps>): SearchScheduleViewModel {
  const requiredPermission = props?.requiredPermission ?? AppPermission.ScheduleSearchAvailability;
  const labels = useAppTranslation(Translation.Dashboard.CoreSearchSchedule);

  const store = useSearchScheduleStoreSlice();

  const { commitSearch, ensureDraftDates, hasHydrated, hasSearched } = store;

  useEffect(() => {
    if (!hasHydrated || hasSearched) {
      return;
    }

    commitSearch();
  }, [commitSearch, hasHydrated, hasSearched]);

  useEffect(() => {
    ensureDraftDates();
  }, [ensureDraftDates]);

  const handlers = useSearchScheduleHandlers(
    store.setDraft,
    store.setSelectedTeacher,
    store.setFormFilterDrawerOpen,
    store.setSortMenuAnchorEl
  );

  // Main search query (existing behavior — kept unchanged).
  const mainQuery = useSearchScheduleMainQuery(store.activeInput);

  const activeFromDate = useMemo(
    () => store.activeInput?.fromDate ?? store.draft.fromDate,
    [store.activeInput?.fromDate, store.draft.fromDate]
  );
  const activeToDate = useMemo(
    () => store.activeInput?.toDate ?? store.draft.toDate,
    [store.activeInput?.toDate, store.draft.toDate]
  );

  // Month drawer query — uses the same draft + a teacher-specific month window.
  const monthDrawer = useSearchScheduleMonthDrawer({
    draft: store.draft,
    activeFromDate,
    monthDrawerOpen: store.monthDrawerOpen,
    monthDrawerTeacher: store.monthDrawerTeacher,
    monthDrawerCurrentMonthIso: store.monthDrawerCurrentMonthIso,
    monthDrawerAnchorFromDate: store.monthDrawerAnchorFromDate,
    openMonthDrawer: store.openMonthDrawer,
    closeMonthDrawer: store.closeMonthDrawer,
    setMonthDrawerCurrentMonth: store.setMonthDrawerCurrentMonth,
  });

  return buildSearchScheduleViewModel({
    labels,
    requiredPermission,
    store,
    handlers,
    mainQuery,
    activeFromDate,
    activeToDate,
    monthDrawer,
  });
}
