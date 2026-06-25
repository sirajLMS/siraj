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
import { StudentStatus } from "../graphql/generated/gql/graphql-types";
import type { StudentDirectoryRowExtended } from "../views/dashboard/students/home/types";

interface StudentsState {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly totalStudents: number;
  readonly searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const STUDENT_METRICS: MetricItem[] = [
  {
    key: "activated",
    count: 1284,
    labelKey: "dashboard.studentDirectory.metrics.activated",
    icon: CheckCircleOutlineOutlined,
  },
  {
    key: "deactivated",
    count: 156,
    labelKey: "dashboard.studentDirectory.metrics.deactivated",
    icon: CancelOutlined,
  },
  {
    key: "regular",
    count: 942,
    labelKey: "dashboard.studentDirectory.metrics.regular",
    icon: VerifiedUserOutlined,
  },
  {
    key: "on_leave",
    count: 42,
    labelKey: "dashboard.studentDirectory.metrics.onLeave",
    icon: EventBusyOutlined,
  },
  {
    key: "suspended",
    count: 18,
    labelKey: "dashboard.studentDirectory.metrics.suspended",
    icon: WarningAmberOutlined,
  },
  {
    key: "on_trial",
    count: 67,
    labelKey: "dashboard.studentDirectory.metrics.onTrial",
    icon: TimerOutlined,
  },
];

const now = new Date().toISOString();

const MOCK_ROWS: StudentDirectoryRowExtended[] = [
  {
    id: "stu-001",
    index: 1,
    name: "Ahmed Mansour",
    email: "a.mansour@university.edu",
    avatarUrl: "/demo/avatars/01.png",
    status: StudentStatus.Regular,
    accountStatus: "regular",
    enrollmentStatus: "regular",
    hoursPerWeek: 12.5,
    classesRemaining: 15,
    classesTotal: 20,
    parentName: "Mansour Ahmed",
    teacherName: "Dr. Ali Ahmed",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "stu-002",
    index: 2,
    name: "Sarah Al-Farsi",
    email: "sarah.farsi@gmail.com",
    avatarUrl: "/demo/avatars/02.png",
    parentName: "Sarah Farsi",
    teacherName: "Dr. Ali Farsi",
    status: StudentStatus.Regular,
    accountStatus: "regular",
    enrollmentStatus: "regular",
    hoursPerWeek: 8,
    classesRemaining: 4,
    classesTotal: 10,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "stu-003",
    index: 3,
    name: "Omar Ibrahim",
    email: "o.ibrahim@lms.com",
    avatarUrl: "/demo/avatars/03.png",
    accountStatus: "suspended",
    enrollmentStatus: "regular",
    hoursPerWeek: 0,
    classesRemaining: 1,
    classesTotal: 10,
    status: StudentStatus.Suspended,
    parentName: null,
    teacherName: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "stu-004",
    index: 4,
    name: "Layla Khalil",
    email: "layla.k@edu.com",
    avatarUrl: "/demo/avatars/04.png",
    accountStatus: "on_leave",
    enrollmentStatus: "regular",
    hoursPerWeek: 0,
    classesRemaining: 12,
    classesTotal: 12,
    status: StudentStatus.OnLeave,
    parentName: null,
    teacherName: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "stu-005",
    index: 5,
    name: "Zaid Ahmed",
    email: "z.hassan@academy.org",
    avatarUrl: "/demo/avatars/05.png",
    accountStatus: "activated",
    enrollmentStatus: "regular",
    hoursPerWeek: 15,
    classesRemaining: 27,
    classesTotal: 30,
    status: StudentStatus.Regular,
    parentName: null,
    teacherName: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "stu-006",
    index: 6,
    name: "Aria Abbott",
    email: "aria.abbott@email.com",
    avatarUrl: "/demo/avatars/06.png",
    accountStatus: "activated",
    enrollmentStatus: "regular",
    hoursPerWeek: 12.5,
    classesRemaining: 15,
    classesTotal: 20,
    status: StudentStatus.Regular,
    parentName: null,
    teacherName: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "stu-007",
    index: 7,
    name: "Julian Meyer",
    email: "j.meyer@edu.org",
    avatarUrl: "/demo/avatars/07.png",
    accountStatus: "on_trial",
    enrollmentStatus: "prospect",
    hoursPerWeek: 6,
    classesRemaining: 2,
    classesTotal: 3,
    status: StudentStatus.OnTrial,
    parentName: null,
    teacherName: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "stu-008",
    index: 8,
    name: "Sara Lin",
    email: "sara.lin@univ.co",
    avatarUrl: "/demo/avatars/08.png",
    accountStatus: "deactivated",
    enrollmentStatus: "withdrawn",
    hoursPerWeek: 0,
    classesRemaining: 0,
    classesTotal: 20,
    isDeactivated: true,
    status: StudentStatus.Deactivated,
    parentName: null,
    teacherName: null,
    createdAt: now,
    updatedAt: now,
  },
];

export const MOBILE_METRIC_ICONS = {
  activated: HowToRegOutlined,
  regular: PersonOutlined,
  on_leave: EventBusyOutlined,
  suspended: BlockOutlined,
} as const;

export const useStudentsStore = create<StudentsState>(set => ({
  metrics: STUDENT_METRICS,
  rows: MOCK_ROWS,
  totalStudents: 1284,
  searchQuery: "",

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));
