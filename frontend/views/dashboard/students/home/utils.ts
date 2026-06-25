import type { SvgIconComponent } from "@mui/icons-material";
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
import type { useTranslations } from "next-intl";
import type { StudentDirectoryQuery } from "@/frontend/graphql/generated/gql/operations";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import type { StudentsViewLabels } from "./StudentsView";
import type { StudentAccountStatus, StudentDirectoryRowExtended, StudentEnrollmentStatus } from "./types";
import { MOBILE_METRIC_KEYS } from "./types";

const MOBILE_METRIC_ICONS = {
  activated: HowToRegOutlined,
  regular: PersonOutlined,
  on_leave: EventBusyOutlined,
  suspended: BlockOutlined,
} as const;

const METRIC_DEFINITIONS = [
  { key: "activated" as const, icon: CheckCircleOutlineOutlined },
  { key: "deactivated" as const, icon: CancelOutlined },
  { key: "regular" as const, icon: VerifiedUserOutlined },
  { key: "on_leave" as const, icon: EventBusyOutlined },
  { key: "suspended" as const, icon: WarningAmberOutlined },
  { key: "on_trial" as const, icon: TimerOutlined },
];

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
    return s;
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

type RawStudentRow = NonNullable<StudentDirectoryQuery["studentDirectory"]>[number];

export function buildStudentRows(data: StudentDirectoryQuery | undefined): StudentDirectoryRowExtended[] {
  if (!data?.studentDirectory) return [];
  return data.studentDirectory.map((row: RawStudentRow, index: number) => {
    const accountStatus = mapStatus(row.status);
    return {
      ...row,
      id: row.id ?? "",
      index: index + 1,
      name: row.name ?? "",
      email: row.email ?? "",
      accountStatus,
      enrollmentStatus: getEnrollmentStatus(row.status),
      hoursPerWeek: row.hoursPerWeek ?? 0,
      classesRemaining: row.classesRemaining ?? 0,
      classesTotal: row.classesTotal ?? 0,
      isDeactivated: accountStatus === "deactivated",
    };
  });
}

export function buildStatusCounts(rows: StudentDirectoryRowExtended[]): Record<StudentAccountStatus, number> {
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
}

function toMetricItem(
  key: string,
  count: number,
  icon: SvgIconComponent,
  t: ReturnType<typeof useTranslations>
): MetricItem {
  return {
    key,
    count,
    labelKey: key,
    label: t(`metrics.${getMetricTranslationKey(key)}`),
    icon,
    variant: key === "suspended" ? ("error" as const) : undefined,
  };
}

export function buildViewMetrics(
  counts: Record<StudentAccountStatus, number>,
  t: ReturnType<typeof useTranslations>
): MetricItem[] {
  return METRIC_DEFINITIONS.map(({ key, icon }) => toMetricItem(key, counts[key], icon, t));
}

export function buildMobileMetrics(
  counts: Record<StudentAccountStatus, number>,
  t: ReturnType<typeof useTranslations>
): MetricItem[] {
  return MOBILE_METRIC_KEYS.map(key => toMetricItem(key, counts[key], MOBILE_METRIC_ICONS[key], t));
}

export function buildLabels(t: ReturnType<typeof useTranslations>): StudentsViewLabels {
  return {
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
    statusLabels: {
      activated: t("status.activated"),
      deactivated: t("status.deactivated"),
      regular: t("status.regular"),
      on_leave: t("status.onLeave"),
      suspended: t("status.suspended"),
      on_trial: t("status.onTrial"),
    },
    enrollmentLabels: {
      regular: t("enrollment.regular"),
      prospect: t("enrollment.prospect"),
      withdrawn: t("enrollment.withdrawn"),
    },
  };
}

export function buildFilteredRows(
  rows: StudentDirectoryRowExtended[],
  searchQuery: string
): StudentDirectoryRowExtended[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter(row => {
    const name = row.name ?? "";
    const email = row.email ?? "";
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });
}
