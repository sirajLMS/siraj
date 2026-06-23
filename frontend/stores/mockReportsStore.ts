// cspell:disable
import { create } from "zustand";

import type {
  ReportFilters,
  ReportLedgerRow,
  ReportsSummary,
  ReportTeacherOption,
  ReportType,
} from "@/frontend/views/dashboard/reports/types/reportsTypes";

interface ReportsState {
  readonly filters: ReportFilters;
  readonly rows: readonly ReportLedgerRow[];
  readonly summary: ReportsSummary;
  readonly teachers: readonly ReportTeacherOption[];
  setFromDate: (fromDate: string) => void;
  setToDate: (toDate: string) => void;
  setTeacherId: (teacherId: string) => void;
  setReportType: (reportType: ReportType) => void;
}

const MOCK_TEACHERS: ReportTeacherOption[] = [
  { id: "tea-ahmed", name: "Dr. Ahmed Ahmed" },
  { id: "tea-sarah", name: "Prof. Sarah Miller" },
  { id: "tea-james", name: "Instructor James Bond" },
];

const MOCK_ROWS: ReportLedgerRow[] = [
  {
    id: "rep-001",
    name: "Dr. Ahmed Ahmed",
    studentName: "Omar Ali",
    avatarInitials: "AH",
    status: "active",
    taken: 42,
    absent: 2,
    leave: 1,
    pending: 0,
    hours: "63:00",
    paidEgp: 12600,
    paidUsd: 0,
  },
  {
    id: "rep-002",
    name: "Prof. Sarah Miller",
    studentName: "Sarah Khan",
    avatarInitials: "SM",
    status: "on_break",
    taken: 35,
    absent: 0,
    leave: 0,
    pending: 2,
    hours: "52:30",
    paidEgp: 0,
    paidUsd: 1575,
  },
  {
    id: "rep-003",
    name: "Instructor James Bond",
    studentName: "John Smith",
    avatarInitials: "JB",
    status: "active",
    taken: 28,
    absent: 4,
    leave: 0,
    pending: 1,
    hours: "42:00",
    paidEgp: 8400,
    paidUsd: 0,
  },
];

const MOCK_SUMMARY: ReportsSummary = {
  engagementRate: 94.2,
  engagementGrowth: 12.4,
  egpPercent: 65,
  usdPercent: 35,
  totalHours: "157:30",
  totalEgp: 21000,
  totalUsd: 1575,
};

export const useReportsStore = create<ReportsState>(set => ({
  filters: {
    fromDate: "2023-08-01",
    toDate: "2023-08-31",
    teacherId: "",
    reportType: "by_teacher",
  },
  rows: MOCK_ROWS,
  summary: MOCK_SUMMARY,
  teachers: MOCK_TEACHERS,
  setFromDate: fromDate => {
    set(state => ({ filters: { ...state.filters, fromDate } }));
  },
  setToDate: toDate => {
    set(state => ({ filters: { ...state.filters, toDate } }));
  },
  setTeacherId: teacherId => {
    set(state => ({ filters: { ...state.filters, teacherId } }));
  },
  setReportType: reportType => {
    set(state => ({ filters: { ...state.filters, reportType } }));
  },
}));
