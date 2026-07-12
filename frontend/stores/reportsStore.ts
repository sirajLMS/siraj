import { create } from "zustand";
import { ReportGroupingMode } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ReportType } from "@/frontend/views/dashboard/reports/types/reportsTypes";

const DEFAULT_FROM_DATE = "2023-08-01";
const DEFAULT_TO_DATE = "2023-08-31";

export interface ReportsActiveFilters {
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
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  setTeacherId: (id: string) => void;
  setReportType: (type: ReportType) => void;
  setActiveFilters: (filters: ReportsActiveFilters) => void;
}

const defaultActiveFilters: ReportsActiveFilters = {
  fromDate: DEFAULT_FROM_DATE,
  toDate: DEFAULT_TO_DATE,
  teacherId: null,
  groupBy: ReportGroupingMode.Teacher,
};

export const useReportsStore = create<ReportsState>(set => ({
  fromDate: DEFAULT_FROM_DATE,
  toDate: DEFAULT_TO_DATE,
  teacherId: "",
  reportType: "by_teacher",
  activeFilters: defaultActiveFilters,
  setFromDate: date => set({ fromDate: date }),
  setToDate: date => set({ toDate: date }),
  setTeacherId: id => set({ teacherId: id }),
  setReportType: type => set({ reportType: type }),
  setActiveFilters: filters => set({ activeFilters: filters }),
}));
