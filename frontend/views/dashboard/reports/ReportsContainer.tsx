"use client";

import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import type { AttendanceReportRow } from "@/frontend/graphql/generated/gql/graphql-types";
import { AppPermission, ReportGroupingMode } from "@/frontend/graphql/generated/gql/graphql-types";
import { generateAttendanceReportQueryDocument } from "@/frontend/graphql/sharedDocuments/report.documents";
import { teachersQueryDocument } from "@/frontend/graphql/sharedDocuments/teacher.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { exportAttendanceReport } from "@/frontend/utils/excel-export/report-export";
import { logger } from "@/frontend/utils/logger";
import { useRouter } from "@/shared/i18n/routing";
import { ReportsView } from "./ReportsView";
import type { ReportLedgerRow, ReportsSummary, ReportType } from "./types/reportsTypes";

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function mapReportRows(reportRows: readonly AttendanceReportRow[] | null | undefined): readonly ReportLedgerRow[] {
  if (!reportRows) {
    return [];
  }

  return reportRows.map((row: AttendanceReportRow, index: number) => ({
    id: row.id ?? row.groupKey ?? `rep-${index}`,
    entityId: row.groupKey ?? null,
    name: row.groupLabel ?? "",
    studentName: "",
    avatarInitials: row.groupLabel
      ? row.groupLabel
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "",
    status: "active",
    taken: row.takenClasses ?? 0,
    absent: row.absentClasses ?? 0,
    leave: row.leaveClasses ?? 0,
    pending: row.pendingClasses ?? 0,
    hours: formatHours(row.totalHours ?? 0),
    paidEgp: row.paidEGP ?? 0,
    paidUsd: row.paidUSD ?? 0,
  }));
}

interface ReportsMainContentProps {
  readonly reportData:
    | {
        readonly generateAttendanceReport?: {
          readonly rows?: readonly AttendanceReportRow[] | null;
          readonly engagementGrowth?: number | null;
        } | null;
      }
    | undefined;
  readonly summary: ReportsSummary;
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
  readonly teachers: readonly { readonly id: string; readonly name: string }[];
  readonly canGenerate: boolean;
  readonly onFromDateChange: (date: string) => void;
  readonly onToDateChange: (date: string) => void;
  readonly onTeacherChange: (id: string) => void;
  readonly onReportTypeChange: (type: ReportType) => void;
  readonly onSubmit: () => void;
  readonly onExportCsv: () => void;
  readonly onPrintReport: () => void;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
}

function ReportsMainContent({
  reportData,
  summary,
  fromDate,
  toDate,
  teacherId,
  reportType,
  teachers,
  canGenerate,
  onFromDateChange,
  onToDateChange,
  onTeacherChange,
  onReportTypeChange,
  onSubmit,
  onExportCsv,
  onPrintReport,
  onRowClick,
}: ReportsMainContentProps) {
  const t = useTranslations("dashboard.reports");

  const rows = useMemo(() => mapReportRows(reportData?.generateAttendanceReport?.rows), [reportData]);

  const labels = {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    filtersTitle: t("filtersTitle"),
    exportCsv: t("exportCsv"),
    printReport: t("printReport"),
    filtersLabels: {
      fromDate: t("fromDate"),
      toDate: t("toDate"),
      teacher: t("teacher"),
      allTeachers: t("allTeachers"),
      reportType: t("reportType"),
      submit: t("submit"),
      reportTypes: {
        byTeacher: t("reportTypes.byTeacher"),
        byStudent: t("reportTypes.byStudent"),
        byDate: t("reportTypes.byDate"),
      },
    },
    tableLabels: {
      name: t("table.name"),
      taken: t("table.taken"),
      absent: t("table.absent"),
      leave: t("table.leave"),
      pending: t("table.pending"),
      hours: t("table.hours"),
      paidEgp: t("table.paidEgp"),
      paidUsd: t("table.paidUsd"),
      noEntries: t("noEntries"),
    },
    summaryLabels: {
      engagementRate: t("summary.engagementRate"),
      engagementGrowth: t("summary.engagementGrowth"),
      increase: t("summary.increase"),
      financialDistribution: t("summary.financialDistribution"),
      financialSubtitle: t("summary.financialSubtitle"),
      egpLabel: t("summary.egpLabel"),
      usdLabel: t("summary.usdLabel"),
    },
    totalsLabel: t("table.totals"),
    ledgerTitle: t("ledger.title"),
    ledgerLabels: {
      studentLabel: t.raw("ledger.studentLabel") as string,
      paid: t("ledger.paid"),
      statusLabels: {
        active: t("status.active"),
        on_break: t("status.onBreak"),
      },
      taken: t("table.taken"),
      absent: t("table.absent"),
      leave: t("table.leave"),
      pending: t("table.pending"),
      hours: t("table.hours"),
    },
  };

  return (
    <ReportsView
      labels={labels}
      fromDate={fromDate}
      toDate={toDate}
      teacherId={teacherId}
      reportType={reportType}
      teachers={teachers}
      rows={rows}
      summary={summary}
      canGenerate={canGenerate}
      onFromDateChange={onFromDateChange}
      onToDateChange={onToDateChange}
      onTeacherChange={onTeacherChange}
      onReportTypeChange={onReportTypeChange}
      onSubmit={onSubmit}
      onExportCsv={onExportCsv}
      onPrintReport={onPrintReport}
      onRowClick={onRowClick}
    />
  );
}

function mapReportTypeToGroupingMode(reportType: ReportType): ReportGroupingMode {
  if (reportType === "by_date") return ReportGroupingMode.Date;
  if (reportType === "by_student") return ReportGroupingMode.Student;
  return ReportGroupingMode.Teacher;
}

function useReportFilters() {
  const [fromDate, setFromDate] = useState("2023-08-01");
  const [toDate, setToDate] = useState("2023-08-31");
  const [teacherId, setTeacherId] = useState("");
  const [reportType, setReportType] = useState<ReportType>("by_teacher");

  const [activeFilters, setActiveFilters] = useState<{
    readonly fromDate: string;
    readonly toDate: string;
    readonly teacherId: string | null;
    readonly groupBy: ReportGroupingMode;
  }>({
    fromDate: "2023-08-01",
    toDate: "2023-08-31",
    teacherId: null,
    groupBy: ReportGroupingMode.Teacher,
  });

  return {
    fromDate,
    toDate,
    teacherId,
    reportType,
    activeFilters,
    setActiveFilters,
    setFromDate,
    setToDate,
    setTeacherId,
    setReportType,
  };
}

function useReportData(activeFilters: {
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string | null;
  readonly groupBy: ReportGroupingMode;
}) {
  const { data: teachersData } = useQuery(teachersQueryDocument, {
    variables: { search: "", limit: 100 },
  });

  const teachers = useMemo(() => {
    if (!teachersData?.teachers) {
      return [];
    }
    return teachersData.teachers
      .filter((t): t is { id: string; name: string } => typeof t.id === "string" && typeof t.name === "string")
      .map(t => ({ id: t.id, name: t.name }));
  }, [teachersData]);

  const { data: reportData } = useQuery(generateAttendanceReportQueryDocument, {
    variables: { filters: activeFilters },
    fetchPolicy: "network-only",
  });

  const rows = useMemo(() => mapReportRows(reportData?.generateAttendanceReport?.rows), [reportData]);

  const summary = useMemo<ReportsSummary>(() => {
    if (rows.length === 0) {
      return {
        engagementRate: 0,
        engagementGrowth: null,
        egpPercent: 100,
        usdPercent: 0,
        totalHours: "0:00",
        totalEgp: 0,
        totalUsd: 0,
      };
    }

    const totalTaken = rows.reduce((sum, r) => sum + r.taken, 0);
    const totalAbsent = rows.reduce((sum, r) => sum + r.absent, 0);
    const totalLeave = rows.reduce((sum, r) => sum + r.leave, 0);
    const totalAttempted = totalTaken + totalAbsent + totalLeave;

    const engagementRate = totalAttempted > 0 ? Math.round((totalTaken / totalAttempted) * 1000) / 10 : 0;
    const engagementGrowth = reportData?.generateAttendanceReport?.engagementGrowth ?? null;

    const totalHoursFloat =
      reportData?.generateAttendanceReport?.rows?.reduce(
        (sum: number, r: AttendanceReportRow) => sum + (r.totalHours ?? 0),
        0
      ) ?? 0;

    const totalEgp = rows.reduce((sum, r) => sum + r.paidEgp, 0);
    const totalUsd = rows.reduce((sum, r) => sum + r.paidUsd, 0);
    const totalPaid = totalEgp + totalUsd;

    const egpPercent = totalPaid > 0 ? Math.round((totalEgp / totalPaid) * 100) : 100;
    const usdPercent = totalPaid > 0 ? 100 - egpPercent : 0;

    return {
      engagementRate,
      engagementGrowth,
      egpPercent,
      usdPercent,
      totalHours: formatHours(totalHoursFloat),
      totalEgp,
      totalUsd,
    };
  }, [rows, reportData]);

  return { reportData, teachers, rows, summary };
}

function useReportHandlers({
  fromDate,
  toDate,
  teacherId,
  reportType,
  rows,
  summary,
  showFinancials,
  setActiveFilters,
}: {
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
  readonly rows: readonly ReportLedgerRow[];
  readonly summary: ReportsSummary;
  readonly showFinancials: boolean;
  readonly setActiveFilters: (filters: {
    readonly fromDate: string;
    readonly toDate: string;
    readonly teacherId: string | null;
    readonly groupBy: ReportGroupingMode;
  }) => void;
}) {
  const router = useRouter();

  const handleSubmit = useCallback(() => {
    if (fromDate > toDate) {
      logger.warn("From date must be before or equal to To date");
      return;
    }

    setActiveFilters({
      fromDate,
      toDate,
      teacherId: teacherId || null,
      groupBy: mapReportTypeToGroupingMode(reportType),
    });
  }, [fromDate, toDate, teacherId, reportType, setActiveFilters]);

  const handleExportCsv = useCallback(() => {
    exportAttendanceReport({
      rows,
      summary,
      labels: {
        pageTitle: "Attendance Report",
        tableLabels: {
          name: "Name",
          taken: "Taken",
          absent: "Absent",
          leave: "Leave",
          pending: "Pending",
          hours: "Hours",
          paidEgp: "Paid (EGP)",
          paidUsd: "Paid (USD)",
        },
        totalsLabel: "Totals",
        summaryLabels: {
          engagementRate: "Engagement Rate",
          financialDistribution: "Currency Split",
          egpLabel: "EGP",
          usdLabel: "USD",
        },
      },
      fromDate,
      toDate,
      showFinancials,
    }).catch((error: unknown) => {
      logger.error("Excel export failed", error);
    });
  }, [rows, summary, fromDate, toDate, showFinancials]);

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  const handleRowClick = useCallback(
    (row: ReportLedgerRow) => {
      if (!row.entityId) return;
      if (reportType === "by_teacher") {
        router.push(`/teachers/${row.entityId}/profile`);
      } else if (reportType === "by_student") {
        router.push(`/students/${row.entityId}/status`);
      }
    },
    [reportType, router]
  );

  return { handleSubmit, handleExportCsv, handlePrintReport, handleRowClick };
}

export function ReportsContainer() {
  const { hasPermission } = useUserStore();
  const canGenerate = hasPermission(AppPermission.ReportGenerateCustom);
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);

  const {
    fromDate,
    toDate,
    teacherId,
    reportType,
    activeFilters,
    setActiveFilters,
    setFromDate,
    setToDate,
    setTeacherId,
    setReportType,
  } = useReportFilters();

  const { reportData, teachers, rows, summary } = useReportData(activeFilters);

  const { handleSubmit, handleExportCsv, handlePrintReport, handleRowClick } = useReportHandlers({
    fromDate,
    toDate,
    teacherId,
    reportType,
    rows,
    summary,
    showFinancials,
    setActiveFilters,
  });

  return (
    <RequirePermission permissions={[AppPermission.ReportGenerateCustom]}>
      <ReportsMainContent
        reportData={reportData}
        summary={summary}
        fromDate={fromDate}
        toDate={toDate}
        teacherId={teacherId}
        reportType={reportType}
        teachers={teachers}
        canGenerate={canGenerate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onTeacherChange={setTeacherId}
        onReportTypeChange={setReportType}
        onSubmit={handleSubmit}
        onExportCsv={handleExportCsv}
        onPrintReport={handlePrintReport}
        onRowClick={reportType !== "by_date" ? handleRowClick : undefined}
      />
    </RequirePermission>
  );
}
