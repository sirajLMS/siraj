"use client";

import { useQuery } from "@apollo/client/react";
import {
  BlockOutlined,
  CancelOutlined,
  CheckCircleOutlineOutlined,
  EventBusyOutlined,
  HowToRegOutlined,
  PersonOutlined,
  TimerOutlined,
  VerifiedUserOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { studentDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/student-directory.documents";
import { useStudentDirectoryStore } from "@/frontend/stores/studentDirectoryStore";
import { StudentsView } from "./StudentsView";
import type { StudentAccountStatus, StudentEnrollmentStatus } from "./types";
import { MOBILE_METRIC_KEYS } from "./types";

const MOBILE_METRIC_ICONS = {
  activated: HowToRegOutlined,
  regular: PersonOutlined,
  on_leave: EventBusyOutlined,
  suspended: BlockOutlined,
} as const;

function mapStatus(status: string | null | undefined): StudentAccountStatus {
  if (!status) return "regular";
  const s = status.toLowerCase();
  if (
    s === "on_leave" ||
    s === "on_trial" ||
    s === "activated" ||
    s === "deactivated" ||
    s === "suspended" ||
    s === "regular"
  ) {
    return s as StudentAccountStatus;
  }
  return "regular";
}

function getEnrollmentStatus(status: string | null | undefined): StudentEnrollmentStatus {
  if (!status) return "regular";
  const s = status.toUpperCase();
  if (s === "DEACTIVATED") return "withdrawn";
  if (s === "ON_TRIAL") return "prospect";
  return "regular";
}

function getMetricTranslationKey(key: string): string {
  if (key === "on_leave") return "onLeave";
  if (key === "on_trial") return "onTrial";
  return key;
}

export function StudentsContainer() {
  const t = useTranslations("dashboard.studentDirectory");
  const router = useRouter();

  const searchQuery = useStudentDirectoryStore(state => state.searchQuery);
  const setSearchQuery = useStudentDirectoryStore(state => state.setSearchQuery);

  const { data } = useQuery(studentDirectoryQueryDocument, {
    variables: {
      filterArgs: null,
      orderBy: null,
      paginationArgs: null,
    },
  });

  const rows = useMemo(() => {
    if (!data?.studentDirectory) return [];
    return data.studentDirectory.map(
      (row: NonNullable<NonNullable<typeof data>["studentDirectory"]>[number], index: number) => {
        const accountStatus = mapStatus(row.status);
        return {
          id: row.id ?? "",
          index: index + 1,
          name: row.name ?? "",
          email: row.email ?? "",
          avatarUrl: `/demo/avatars/${String((index % 8) + 1).padStart(2, "0")}.png`,
          accountStatus,
          enrollmentStatus: getEnrollmentStatus(row.status),
          hoursPerWeek: row.hoursPerWeek ? Number.parseFloat(row.hoursPerWeek) : 0,
          classesRemaining: row.classesRemaining ?? 0,
          classesTotal: row.classesTotal ?? 0,
          isDeactivated: accountStatus === "deactivated",
        };
      }
    );
  }, [data]);

  const totalStudents = rows.length;

  const counts = useMemo(() => {
    const res: Record<StudentAccountStatus, number> = {
      activated: 0,
      deactivated: 0,
      regular: 0,
      on_leave: 0,
      suspended: 0,
      on_trial: 0,
    };
    for (const r of rows) {
      res[r.accountStatus] = (res[r.accountStatus] || 0) + 1;
    }
    return res;
  }, [rows]);

  const metrics = [
    {
      key: "activated",
      count: counts.activated,
      labelKey: "dashboard.studentDirectory.metrics.activated",
      icon: CheckCircleOutlineOutlined,
    },
    {
      key: "deactivated",
      count: counts.deactivated,
      labelKey: "dashboard.studentDirectory.metrics.deactivated",
      icon: CancelOutlined,
    },
    {
      key: "regular",
      count: counts.regular,
      labelKey: "dashboard.studentDirectory.metrics.regular",
      icon: VerifiedUserOutlined,
    },
    {
      key: "on_leave",
      count: counts.on_leave,
      labelKey: "dashboard.studentDirectory.metrics.onLeave",
      icon: EventBusyOutlined,
    },
    {
      key: "suspended",
      count: counts.suspended,
      labelKey: "dashboard.studentDirectory.metrics.suspended",
      icon: WarningAmberOutlined,
    },
    {
      key: "on_trial",
      count: counts.on_trial,
      labelKey: "dashboard.studentDirectory.metrics.onTrial",
      icon: TimerOutlined,
    },
  ];

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
    return rows.filter(
      (row: (typeof rows)[number]) => row.name.toLowerCase().includes(query) || row.email.toLowerCase().includes(query)
    );
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
    <RequirePermission permissions={[AppPermission.StudentsList]}>
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
    </RequirePermission>
  );
}
