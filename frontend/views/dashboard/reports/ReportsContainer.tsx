"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useReportsStore } from "@/frontend/stores/mockReportsStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { logger } from "@/frontend/utils/logger";
import { ReportsView } from "./ReportsView";
import { reportFiltersSchema } from "./schemas/reportFiltersSchema";

export function ReportsContainer() {
  const t = useTranslations("dashboard.reports");
  const permissions = useUserStore(state => state.permissions);

  const filters = useReportsStore(state => state.filters);
  const rows = useReportsStore(state => state.rows);
  const summary = useReportsStore(state => state.summary);
  const teachers = useReportsStore(state => state.teachers);
  const setFromDate = useReportsStore(state => state.setFromDate);
  const setToDate = useReportsStore(state => state.setToDate);
  const setTeacherId = useReportsStore(state => state.setTeacherId);
  const setReportType = useReportsStore(state => state.setReportType);

  const canGenerate = permissions.includes(AppPermission.ReportsGenerate);

  const filteredRows = useMemo(() => {
    if (filters.teacherId.length === 0) {
      return rows;
    }
    return rows.filter(row => {
      const teacher = teachers.find(item => item.id === filters.teacherId);
      if (!teacher) {
        return true;
      }
      return row.name === teacher.name;
    });
  }, [filters.teacherId, rows, teachers]);

  const handleSubmit = () => {
    const result = reportFiltersSchema.safeParse(filters);
    if (!result.success) {
      logger.warn("Report filters validation failed", { issues: result.error.issues });
      return;
    }
    logger.info("Report filters submitted", { filters: result.data });
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
    <ReportsView
      labels={labels}
      fromDate={filters.fromDate}
      toDate={filters.toDate}
      teacherId={filters.teacherId}
      reportType={filters.reportType}
      teachers={teachers}
      rows={filteredRows}
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
  );
}
