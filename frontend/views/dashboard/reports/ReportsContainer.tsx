"use client";

import { useQuery } from "@apollo/client/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import type { AttendanceReportRow, CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { AppPermission, ReportGroupingMode } from "@/frontend/graphql/generated/gql/graphql-types";
import { generateAttendanceReportQueryDocument, teachersQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { getCurrencyDisplayName } from "@/frontend/lib/currency";
import { useUserStore } from "@/frontend/stores/userStore";
import { exportAttendanceReport } from "@/frontend/utils/excel-export/report-export";
import { logger } from "@/frontend/utils/logger";
import { profileHrefForTeacher, studentHref } from "@/frontend/utils/profileHref";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { ReportsView } from "@/frontend/views/dashboard/reports/ReportsView";
import type {
  ReportLedgerRow,
  ReportPaidAmount,
  ReportsSummary,
  ReportType,
} from "@/frontend/views/dashboard/reports/types/reportsTypes";
import {
  aggregateCurrencyTotalsWithDisplay,
  formatReportPaidAmount,
} from "@/frontend/views/dashboard/reports/utils/formatReportPaidAmounts";
import { useRouter } from "@/shared/i18n/routing";

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function mapPaidAmounts(
  paidAmounts: AttendanceReportRow["paidAmounts"] | null | undefined
): readonly ReportPaidAmount[] {
  return (paidAmounts ?? [])
    .filter(
      (paid): paid is NonNullable<typeof paid> & { currency: CurrencyCode } =>
        paid != null && paid.id != null && paid.currency != null
    )
    .map(paid => ({
      id: paid.id ?? `${paid.currency}`,
      amount: paid.amount ?? "0",
      currency: paid.currency,
      displayAmount: paid.displayAmount
        ? {
            id: paid.displayAmount.id ?? `display:${paid.id}`,
            amount: paid.displayAmount.amount,
            currency: paid.displayAmount.currency,
            stale: paid.displayAmount.stale,
          }
        : null,
    }));
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
    paidAmounts: mapPaidAmounts(row.paidAmounts),
  }));
}

interface ReportsMainContentProps {
  readonly showFinancials: boolean;
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
  readonly loading?: boolean;
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
  showFinancials,
  reportData,
  summary,
  fromDate,
  toDate,
  teacherId,
  reportType,
  teachers,
  canGenerate,
  loading,
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
      paid: t("table.paid"),
      noEntries: t("noEntries"),
    },
    summaryLabels: {
      engagementRate: t("summary.engagementRate"),
      engagementGrowth: t("summary.engagementGrowth"),
      increase: t("summary.increase"),
      financialDistribution: t("summary.financialDistribution"),
      financialSubtitle: t("summary.financialSubtitle"),
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
    <>
      {showFinancials ? <DisplayCurrencyHint /> : null}
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
        loading={loading}
        onFromDateChange={onFromDateChange}
        onToDateChange={onToDateChange}
        onTeacherChange={onTeacherChange}
        onReportTypeChange={onReportTypeChange}
        onSubmit={onSubmit}
        onExportCsv={onExportCsv}
        onPrintReport={onPrintReport}
        onRowClick={onRowClick}
      />
    </>
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

function useReportData(
  activeFilters: {
    readonly fromDate: string;
    readonly toDate: string;
    readonly teacherId: string | null;
    readonly groupBy: ReportGroupingMode;
  },
  locale: string,
  fxMessages: {
    readonly convertedAmount: (values: {
      lockedAmount: string;
      lockedCurrency: string;
      convertedApprox: string;
      displayCurrency: string;
    }) => string;
    readonly displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  }
) {
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

  const { data: reportData, loading: reportLoading } = useQuery(generateAttendanceReportQueryDocument, {
    variables: { filters: activeFilters },
    fetchPolicy: "network-only",
  });

  const rows = useMemo(() => mapReportRows(reportData?.generateAttendanceReport?.rows), [reportData]);

  const summary = useMemo<ReportsSummary>(() => {
    const reportRows = reportData?.generateAttendanceReport?.rows ?? [];

    if (rows.length === 0) {
      return {
        engagementRate: 0,
        engagementGrowth: null,
        currencyDistribution: [],
        totalHours: "0:00",
      };
    }

    const totalTaken = rows.reduce((sum, r) => sum + r.taken, 0);
    const totalAbsent = rows.reduce((sum, r) => sum + r.absent, 0);
    const totalLeave = rows.reduce((sum, r) => sum + r.leave, 0);
    const totalAttempted = totalTaken + totalAbsent + totalLeave;

    const engagementRate = totalAttempted > 0 ? Math.round((totalTaken / totalAttempted) * 1000) / 10 : 0;
    const engagementGrowth = reportData?.generateAttendanceReport?.engagementGrowth ?? null;

    const totalHoursFloat = reportRows.reduce((sum: number, r: AttendanceReportRow) => sum + (r.totalHours ?? 0), 0);

    const currencyTotals = aggregateCurrencyTotalsWithDisplay(
      reportRows.map(row => ({ paidAmounts: mapPaidAmounts(row.paidAmounts) }))
    );
    const currencyDistribution = currencyTotals.map(slice => ({
      currency: slice.currency,
      amount: slice.amount,
      percent: slice.percent,
      label: getCurrencyDisplayName(slice.currency),
      formattedAmount: formatReportPaidAmount(slice.paidAmount, locale, fxMessages),
    }));

    return {
      engagementRate,
      engagementGrowth,
      currencyDistribution,
      totalHours: formatHours(totalHoursFloat),
    };
  }, [rows, reportData, locale, fxMessages]);

  return { reportData, reportLoading, teachers, rows, summary };
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
  locale,
  exportLabels,
  fxMessages,
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
  readonly locale: string;
  readonly exportLabels: {
    readonly pageTitle: string;
    readonly tableLabels: {
      readonly name: string;
      readonly taken: string;
      readonly absent: string;
      readonly leave: string;
      readonly pending: string;
      readonly hours: string;
      readonly paid: string;
      readonly paidLocked: string;
    };
    readonly totalsLabel: string;
    readonly summaryLabels: {
      readonly engagementRate: string;
      readonly financialDistribution: string;
    };
  };
  readonly fxMessages: {
    readonly convertedAmount: (values: {
      lockedAmount: string;
      lockedCurrency: string;
      convertedApprox: string;
      displayCurrency: string;
    }) => string;
    readonly displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  };
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
        pageTitle: exportLabels.pageTitle,
        tableLabels: {
          name: exportLabels.tableLabels.name,
          taken: exportLabels.tableLabels.taken,
          absent: exportLabels.tableLabels.absent,
          leave: exportLabels.tableLabels.leave,
          pending: exportLabels.tableLabels.pending,
          hours: exportLabels.tableLabels.hours,
          paid: exportLabels.tableLabels.paid,
          paidLocked: exportLabels.tableLabels.paidLocked,
        },
        totalsLabel: exportLabels.totalsLabel,
        summaryLabels: {
          engagementRate: exportLabels.summaryLabels.engagementRate,
          financialDistribution: exportLabels.summaryLabels.financialDistribution,
        },
      },
      fromDate,
      toDate,
      showFinancials,
      locale,
      fxMessages,
    }).catch((error: unknown) => {
      logger.error("Excel export failed", error);
    });
  }, [rows, summary, fromDate, toDate, showFinancials, locale, exportLabels, fxMessages]);

  const handlePrintReport = useCallback(() => {
    globalThis.print();
  }, []);

  const handleRowClick = useCallback(
    (row: ReportLedgerRow) => {
      if (!row.entityId) return;
      if (reportType === "by_teacher") {
        const href = profileHrefForTeacher({ teacherId: row.entityId });
        if (href) {
          router.push(href);
        }
      } else if (reportType === "by_student") {
        router.push(`${studentHref(row.entityId)}/status`);
      }
    },
    [reportType, router]
  );

  return { handleSubmit, handleExportCsv, handlePrintReport, handleRowClick };
}

export function ReportsContainer() {
  const { hasPermission } = useUserStore();
  const locale = useLocale();
  const t = useTranslations("dashboard.reports");
  const tProfile = useTranslations("profile");
  const tErrors = useTranslations("errors");
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

  const fxMessages = useMemo(
    () => ({
      convertedAmount: (values: {
        lockedAmount: string;
        lockedCurrency: string;
        convertedApprox: string;
        displayCurrency: string;
      }) => tProfile("convertedAmount", values),
      displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) =>
        tErrors("displayCurrencyFallback", values),
    }),
    [tProfile, tErrors]
  );

  const { reportData, reportLoading, teachers, rows, summary } = useReportData(activeFilters, locale, fxMessages);

  const { handleSubmit, handleExportCsv, handlePrintReport, handleRowClick } = useReportHandlers({
    fromDate,
    toDate,
    teacherId,
    reportType,
    rows,
    summary,
    showFinancials,
    setActiveFilters,
    locale,
    exportLabels: {
      pageTitle: t("export.pageTitle"),
      tableLabels: {
        name: t("table.name"),
        taken: t("table.taken"),
        absent: t("table.absent"),
        leave: t("table.leave"),
        pending: t("table.pending"),
        hours: t("table.hours"),
        paid: t("table.paidDisplay"),
        paidLocked: t("table.paidLocked"),
      },
      totalsLabel: t("table.totals"),
      summaryLabels: {
        engagementRate: t("summary.engagementRate"),
        financialDistribution: t("summary.financialDistribution"),
      },
    },
    fxMessages,
  });

  return (
    <RequirePermission permissions={[AppPermission.ReportGenerateCustom]}>
      <ReportsMainContent
        showFinancials={showFinancials}
        reportData={reportData}
        summary={summary}
        fromDate={fromDate}
        toDate={toDate}
        teacherId={teacherId}
        reportType={reportType}
        teachers={teachers}
        canGenerate={canGenerate}
        loading={reportLoading}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onTeacherChange={setTeacherId}
        onReportTypeChange={setReportType}
        onSubmit={handleSubmit}
        onExportCsv={handleExportCsv}
        onPrintReport={handlePrintReport}
        onRowClick={reportType === "by_date" ? undefined : handleRowClick}
      />
    </RequirePermission>
  );
}
