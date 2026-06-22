"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { MOBILE_METRIC_ICONS, useStudentsStore } from "@/frontend/stores/mockStudentsStore";
import { StudentsView } from "./StudentsView";
import type { StudentAccountStatus, StudentEnrollmentStatus } from "./types";
import { MOBILE_METRIC_KEYS } from "./types";

function getMetricTranslationKey(key: string): string {
  if (key === "on_leave") return "onLeave";
  if (key === "on_trial") return "onTrial";
  return key;
}

export function StudentsContainer() {
  const t = useTranslations("dashboard.studentDirectory");
  const router = useRouter();

  const metrics = useStudentsStore(state => state.metrics);
  const rows = useStudentsStore(state => state.rows);
  const totalStudents = useStudentsStore(state => state.totalStudents);
  const searchQuery = useStudentsStore(state => state.searchQuery);
  const setSearchQuery = useStudentsStore(state => state.setSearchQuery);

  const statusLabels: Record<StudentAccountStatus, string> = {
    activated: t("status.activated"),
    deactivated: t("status.deactivated"),
    regular: t("status.regular"),
    on_leave: t("status.onLeave"),
    suspended: t("status.suspended"),
    on_trial: t("status.onTrial"),
  };

  const enrollmentLabels: Record<StudentEnrollmentStatus, string> = {
    regular: t("enrollment.regular"),
    prospect: t("enrollment.prospect"),
    withdrawn: t("enrollment.withdrawn"),
  };

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(row => row.name.toLowerCase().includes(query) || row.email.toLowerCase().includes(query));
  }, [rows, searchQuery]);

  const viewMetrics = metrics.map(metric => ({
    key: metric.key,
    count: metric.count,
    labelKey: metric.key,
    label: t(`metrics.${getMetricTranslationKey(metric.key)}`),
    icon: metric.icon,
    variant: metric.key === "suspended" ? ("error" as const) : undefined,
  }));

  const mobileMetrics = MOBILE_METRIC_KEYS.map(key => {
    const metric = metrics.find(m => m.key === key);
    return {
      key,
      count: metric?.count ?? 0,
      labelKey: key,
      label: t(`metrics.${getMetricTranslationKey(key)}`),
      icon: MOBILE_METRIC_ICONS[key],
      variant: key === "suspended" ? ("error" as const) : undefined,
    };
  });

  const labels = {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    mobileTitle: t("mobileTitle"),
    searchPlaceholder: t("searchPlaceholder"),
    addStudent: t("addStudent"),
    filters: t("filters"),
    globalRecord: t("globalRecord"),
    index: t("table.index"),
    student: t("table.student"),
    email: t("table.email"),
    status: t("table.status"),
    hoursPerWeek: t("table.hoursPerWeek"),
    classesLeft: t("table.classesLeft"),
    actions: t("table.actions"),
    showingOf: t.raw("showingOf") as string,
    previous: t("previous"),
    next: t("next"),
    viewProfile: t("actions.viewProfile"),
    viewHistory: t("actions.viewHistory"),
    noEntries: t("noEntries"),
    weeklyHours: t("card.weeklyHours"),
    enrollmentStatus: t("card.enrollmentStatus"),
    statusLabels,
    enrollmentLabels,
  };

  const handleViewProfile = (id: string) => {
    router.push(`/students/${id}`);
  };

  const handleViewHistory = (id: string) => {
    router.push(`/students/${id}/history`);
  };

  const handleAddStudent = () => {
    // Navigate to student onboarding when available
  };

  return (
    <StudentsView
      metrics={viewMetrics}
      mobileMetrics={mobileMetrics}
      rows={filteredRows}
      totalStudents={totalStudents}
      searchQuery={searchQuery}
      labels={labels}
      onSearchChange={setSearchQuery}
      onAddStudent={handleAddStudent}
      onViewProfile={handleViewProfile}
      onViewHistory={handleViewHistory}
    />
  );
}
