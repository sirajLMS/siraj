// cspell:disable
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
import { create } from "zustand";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

export type ParentAccountStatus = "activated" | "deactivated" | "regular" | "on_leave" | "suspended" | "on_trial";

export interface ParentDirectoryRow {
  readonly id: string;
  readonly index: number;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl?: string;
  readonly guardianOf: string;
  readonly time: string;
  readonly accountStatus: ParentAccountStatus;
  readonly unpaidInvoices: number;
}

interface ParentsState {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly ParentDirectoryRow[];
  readonly totalParents: number;
  readonly searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const PARENT_METRICS: MetricItem[] = [
  {
    key: "activated",
    count: 1240,
    labelKey: "dashboard.parentsDirectory.metrics.activated",
    icon: HowToRegOutlined,
  },
  {
    key: "deactivated",
    count: 45,
    labelKey: "dashboard.parentsDirectory.metrics.deactivated",
    icon: CancelOutlined,
  },
  {
    key: "regular",
    count: 980,
    labelKey: "dashboard.parentsDirectory.metrics.regular",
    icon: VerifiedUserOutlined,
  },
  {
    key: "on_leave",
    count: 12,
    labelKey: "dashboard.parentsDirectory.metrics.onLeave",
    icon: EventBusyOutlined,
  },
  {
    key: "suspended",
    count: 8,
    labelKey: "dashboard.parentsDirectory.metrics.suspended",
    icon: BlockOutlined,
  },
  {
    key: "on_trial",
    count: 195,
    labelKey: "dashboard.parentsDirectory.metrics.onTrial",
    icon: TimerOutlined,
  },
];

const MOCK_ROWS: ParentDirectoryRow[] = [
  {
    id: "par-001",
    index: 1042,
    name: "Julianne Smith",
    guardianOf: "Leo Smith",
    email: "julianne.smith@example.com",
    avatarUrl: "/demo/avatars/02.png",
    time: "10:45 AM",
    accountStatus: "regular",
    unpaidInvoices: 0,
  },
  {
    id: "par-002",
    index: 1043,
    name: "Marcus Aurelius",
    guardianOf: "Anton Aurelius",
    email: "m.aurelius@domain.edu",
    avatarUrl: "/demo/avatars/01.png",
    time: "09:12 AM",
    accountStatus: "on_trial",
    unpaidInvoices: 2,
  },
  {
    id: "par-003",
    index: 1044,
    name: "Elena Castillo",
    guardianOf: "Sofia Castillo",
    email: "ecastillo@webmail.com",
    avatarUrl: "/demo/avatars/04.png",
    time: "Yesterday",
    accountStatus: "deactivated",
    unpaidInvoices: 0,
  },
  {
    id: "par-004",
    index: 1045,
    name: "Thomas Wright",
    guardianOf: "Ben Wright",
    email: "t.wright@service.org",
    avatarUrl: "/demo/avatars/03.png",
    time: "2 days ago",
    accountStatus: "regular",
    unpaidInvoices: 0,
  },
  {
    id: "par-005",
    index: 1046,
    name: "Sarah Lee",
    guardianOf: "June Lee",
    email: "sarah.lee@provider.com",
    avatarUrl: "/demo/avatars/06.png",
    time: "5 days ago",
    accountStatus: "on_leave",
    unpaidInvoices: 0,
  },
  {
    id: "par-006",
    index: 1047,
    name: "John Anderson",
    guardianOf: "Sarah Anderson",
    email: "j.anderson@example.com",
    avatarUrl: "/demo/avatars/05.png",
    time: "Today",
    accountStatus: "regular",
    unpaidInvoices: 2,
  },
  {
    id: "par-007",
    index: 1048,
    name: "Elena Rodriguez",
    guardianOf: "Mateo Rodriguez",
    email: "e.rodriguez@gmail.com",
    avatarUrl: "/demo/avatars/08.png",
    time: "1 hour ago",
    accountStatus: "on_trial",
    unpaidInvoices: 0,
  },
  {
    id: "par-008",
    index: 1049,
    name: "Michael Chen",
    guardianOf: "Kevin Chen",
    email: "m.chen@academy.org",
    avatarUrl: "/demo/avatars/07.png",
    time: "Yesterday",
    accountStatus: "deactivated",
    unpaidInvoices: 1,
  },
];

/** Mobile metric subset */
export const MOBILE_METRIC_KEYS = ["activated", "deactivated", "regular", "on_leave", "suspended", "on_trial"] as const;

export const MOBILE_METRIC_ICONS = {
  activated: CheckCircleOutlineOutlined,
  deactivated: CancelOutlined,
  regular: PersonOutlined,
  on_leave: EventBusyOutlined,
  suspended: WarningAmberOutlined,
  on_trial: TimerOutlined,
} as const;

export const useParentsStore = create<ParentsState>(set => ({
  metrics: PARENT_METRICS,
  rows: MOCK_ROWS,
  totalParents: 1240,
  searchQuery: "",

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));
