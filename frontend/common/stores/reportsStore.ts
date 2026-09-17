"use client";

import { format, startOfMonth } from "date-fns";
import { create } from "zustand";
import { ReportGroupingMode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";

const DATE_FILTER_FORMAT = "yyyy-MM-dd";

/** First day of the current month, local time. */
function defaultFromDate(): string {
  return format(startOfMonth(new Date()), DATE_FILTER_FORMAT);
}

/** Today, local time. */
function defaultToDate(): string {
  return format(new Date(), DATE_FILTER_FORMAT);
}

interface ReportsActiveFilters {
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string | null;
  readonly groupBy: ReportGroupingMode;
}

export interface ReportsState {
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
  readonly activeFilters: ReportsActiveFilters;
  // NEW FOR PLAN v5: filtersExpanded lives in the store so the reports
  // filters collapsible (mobile-only variant) does not call useState in tier;
  // the state survives viewport tier switching without losing the user's
  // expanded/collapsed intent.
  readonly filtersExpanded: boolean;
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  setTeacherId: (id: string) => void;
  setReportType: (type: ReportType) => void;
  setActiveFilters: (filters: ReportsActiveFilters) => void;
  // NEW FOR PLAN v5: imperative setter + toggle for filtersExpanded so tier
  // views can dispatch via a prop callback instead of local state.
  setFiltersExpanded: (value: boolean) => void;
  toggleFiltersExpanded: () => void;
}

const defaultActiveFilters = (): ReportsActiveFilters => ({
  fromDate: defaultFromDate(),
  toDate: defaultToDate(),
  teacherId: null,
  groupBy: ReportGroupingMode.Teacher,
});

export const useReportsStore = create<ReportsState>(set => ({
  fromDate: defaultFromDate(),
  toDate: defaultToDate(),
  teacherId: "",
  reportType: "by_teacher",
  activeFilters: defaultActiveFilters(),
  filtersExpanded: false,
  setFromDate: date => set({ fromDate: date }),
  setToDate: date => set({ toDate: date }),
  setTeacherId: id => set({ teacherId: id }),
  setReportType: type => set({ reportType: type }),
  setActiveFilters: filters => set({ activeFilters: filters }),
  // NEW FOR PLAN v5: setters implemented alongside the new field.
  setFiltersExpanded: value => set({ filtersExpanded: value }),
  toggleFiltersExpanded: () => set(state => ({ filtersExpanded: !state.filtersExpanded })),
}));
