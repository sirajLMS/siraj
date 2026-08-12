"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo } from "react";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  type DashboardRole,
  resolveDashboardRole,
} from "@/frontend/common/views/dashboard/dashboard/dashboardRoleHelpers";
import type { ScheduleOverviewData } from "@/frontend/common/views/dashboard/types/dashboard";
import { Translation, useAppTranslation } from "@/shared/locale";

const EMPTY_HEADERS: ScheduleOverviewData["headers"] = {
  className: "",
  student: "",
  teacher: "",
  time: "",
  yourTime: "",
  teacherTime: "",
  studentTime: "",
  duration: "",
  status: "",
  actions: "",
  history: "",
  joinVideo: "",
};

const EMPTY_STATUS_LABELS: ScheduleOverviewData["statusLabels"] = {
  PENDING: "",
  TAKEN: "",
  ABSENT: "",
  LEAVE: "",
  NOT_ACTIVATED: "",
  ACTIVATED: "",
  RUNNING: "",
  COMPLETED: "",
  ON_DEMAND_PENDING_CREDITS: "",
  ON_DEMAND_CONFLICT_HELD: "",
  ON_DEMAND_NO_CREDITS_CANCELLED: "",
  ON_DEMAND_NO_CREDITS_ABSENT: "",
};

export type { DashboardRole } from "@/frontend/common/views/dashboard/dashboard/dashboardRoleHelpers";

export interface DashboardViewModel {
  readonly role: DashboardRole;
  readonly userName: string;
  readonly loading: boolean;
  // Admin dashboard props (when role === "admin")
  readonly todayClassesTitle?: string;
  readonly lastUpdated?: string;
  readonly metrics?: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly scheduleTitle?: string;
  readonly selectedMetricLabel?: string;
  readonly todayLabel?: string;
  readonly previousDayLabel?: string;
  readonly nextDayLabel?: string;
  readonly searchPlaceholder?: string;
  readonly searchValue?: string;
  readonly dateLabel?: string;
  readonly dateValue?: string;
  readonly teacherPlaceholder?: string;
  readonly teacherValue?: string;
  readonly submitLabel?: string;
  readonly teachers?: readonly { readonly id: string; readonly name: string }[];
  readonly rows?: ScheduleOverviewData["rows"];
  readonly headers?: ScheduleOverviewData["headers"];
  readonly statusLabels?: ScheduleOverviewData["statusLabels"];
  readonly detailsLabel?: string;
  readonly emptyMessage?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly onSearchChange?: (value: string) => void;
  readonly onDateChange?: (date: string) => void;
  readonly onTeacherChange?: (teacher: string) => void;
  readonly onSubmit?: () => void;
  // Other role view models could be added here if needed
  // readonly parentViewModel?: ParentDashboardViewModel;
  // readonly teacherViewModel?: TeacherDashboardViewModel;
  // readonly studentViewModel?: StudentDashboardViewModel;
  // readonly supervisorViewModel?: SupervisorDashboardViewModel;
}

export interface UseDashboardViewModelProps {
  readonly onRetry?: () => void;
}

export function useDashboardViewModel(_: Readonly<UseDashboardViewModelProps>): DashboardViewModel {
  const { user, setUser } = useUserStore();
  const adminT = useAppTranslation(Translation.Dashboard.Admin);

  const { data, loading } = useQuery(meQueryDocument, {
    skip: !!user?.role,
  });

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
    }
  }, [data, setUser]);

  const permissions = user?.permissions || [];
  const userName = user?.name || "";

  const role: DashboardRole = resolveDashboardRole(permissions);

  const adminDashboardProps: Partial<DashboardViewModel> = useMemo(() => {
    if (role !== "admin") return {};

    const today = new Date().toISOString().split("T")[0];

    const adminProps: Partial<DashboardViewModel> = {
      todayClassesTitle: adminT.pageTitle,
      lastUpdated: adminT.updatedMinutesAgo(0),
      metrics: [],
      onMetricClick: () => {},
      selectedMetricKey: undefined,
      scheduleTitle: adminT.scheduleOverview,
      selectedMetricLabel: undefined,
      todayLabel: adminT.today,
      previousDayLabel: adminT.previousDay,
      nextDayLabel: adminT.nextDay,
      searchPlaceholder: adminT.searchPlaceholder,
      searchValue: "",
      dateLabel: adminT.listOfClassesOn,
      dateValue: today,
      teacherPlaceholder: adminT.selectTeacher,
      teacherValue: "",
      submitLabel: adminT.submit,
      teachers: [],
      rows: [],
      headers: EMPTY_HEADERS,
      statusLabels: EMPTY_STATUS_LABELS,
      detailsLabel: adminT.details,
      emptyMessage: adminT.noClasses,
      page: 0,
      pageSize: 10,
      totalCount: 0,
      onPageChange: () => {},
      onSearchChange: () => {},
      onDateChange: () => {},
      onTeacherChange: () => {},
      onSubmit: () => {},
    };
    return adminProps;
  }, [role, adminT]);

  return {
    role,
    userName,
    loading: loading && !user,
    ...adminDashboardProps,
  };
}
