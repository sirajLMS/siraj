"use client";

import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import {
  AppPermission,
  type AttendanceReportRow,
  ReportGroupingMode,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { generateAttendanceReportQueryDocument } from "@/frontend/graphql/sharedDocuments/report.documents";
import { teachersQueryDocument } from "@/frontend/graphql/sharedDocuments/teacher.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { ReportsView } from "./ReportsView";
import type { LedgerStatus, ReportLedgerRow, ReportsSummary, ReportType } from "./types/reportsTypes";

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

export function ReportsContainer() {
  const t = useTranslations("dashboard.reports");
  const { hasPermission } = useUserStore();

  const canGenerate = hasPermission(AppPermission.ReportGenerateCustom);

  // Manage filter states locally
  const [fromDate, setFromDate] = useState("2023-08-01");
  const [toDate, setToDate] = useState("2023-08-31");
  const [teacherId, setTeacherId] = useState("");
  const [reportType, setReportType] = useState<ReportType>("by_teacher");

  // Query filters state, initialized to run query on mount
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

  // Fetch teachers list for the dropdown
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

  // Fetch reporting data
  const { data: reportData } = useQuery(generateAttendanceReportQueryDocument, {
    variables: { filters: activeFilters },
    fetchPolicy: "network-only",
  });

  // Map backend AttendanceReportRow to UI ReportLedgerRow
  const rows = useMemo<readonly ReportLedgerRow[]>(() => {
    if (!reportData?.generateAttendanceReport) {
      return [];
    }

    return reportData.generateAttendanceReport.map((row: AttendanceReportRow, index: number) => ({
      id: row.id ?? row.groupKey ?? `rep-${index}`,
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
      status: "active" as LedgerStatus,
      taken: row.takenClasses ?? 0,
      absent: row.absentClasses ?? 0,
      leave: row.leaveClasses ?? 0,
      pending: row.pendingClasses ?? 0,
      hours: formatHours(row.totalHours ?? 0),
      paidEgp: row.paidEGP ?? 0,
      paidUsd: row.paidUSD ?? 0,
    }));
  }, [reportData]);

  // Calculate summary statistics
  const summary = useMemo<ReportsSummary>(() => {
    if (rows.length === 0) {
      return {
        engagementRate: 0,
        engagementGrowth: 0,
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
    const engagementGrowth = 12.4; // historical benchmark

    const totalHoursFloat =
      reportData?.generateAttendanceReport?.reduce(
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

  const handleSubmit = () => {
    if (fromDate > toDate) {
      logger.warn("From date must be before or equal to To date");
      return;
    }

    const mappedGroupBy = reportType === "by_date" ? ReportGroupingMode.Date : ReportGroupingMode.Teacher;

    setActiveFilters({
      fromDate,
      toDate,
      teacherId: teacherId || null,
      groupBy: mappedGroupBy,
    });
  };

  const handleExportCsv = () => {
    logger.info("Export CSV requested");
  };

  const handlePrintReport = () => {
    logger.info("Print report requested");
  };

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
    <RequirePermission permissions={[AppPermission.ReportGenerateCustom]}>
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
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onTeacherChange={setTeacherId}
        onReportTypeChange={setReportType}
        onSubmit={handleSubmit}
        onExportCsv={handleExportCsv}
        onPrintReport={handlePrintReport}
      />
    </RequirePermission>
  );
}
