import type { StudentDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";
import { StudentStatus } from "@/shared/lib/enum";

export enum StudentEnrollmentStatus {
  REGULAR = "regular",
  PROSPECT = "prospect",
  WITHDRAWN = "withdrawn",
}

export const STUDENT_STATUS_TO_ACCOUNT_STATUS: Record<StudentStatus, StudentAccountStatus> = {
  [StudentStatus.REGULAR]: "regular",
  [StudentStatus.DEACTIVATED]: "deactivated",
  [StudentStatus.ON_LEAVE]: "on_leave",
  [StudentStatus.SUSPENDED]: "suspended",
  [StudentStatus.ON_TRIAL]: "on_trial",
};

export type StudentAccountStatus = "deactivated" | "regular" | "on_leave" | "suspended" | "on_trial";

export const MOBILE_METRIC_KEYS = ["regular", "on_leave", "suspended"] as const;

export const MOBILE_METRIC_ICON_KEYS = {
  regular: "PersonOutlined",
  on_leave: "EventBusyOutlined",
  suspended: "BlockOutlined",
} as const;

export type StudentDirectoryRowExtended = Readonly<StudentDirectoryRow> & {
  readonly index: number;
  readonly accountStatus: StudentAccountStatus;
  readonly enrollmentStatus: StudentEnrollmentStatus;
  readonly isDeactivated?: boolean;
};

export interface StudentsViewLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly mobileTitle: string;
  readonly searchPlaceholder: string;
  readonly addStudent: string;
  readonly filters: string;
  readonly globalRecord: string;
  readonly index: string;
  readonly student: string;
  readonly email: string;
  readonly status: string;
  readonly hoursPerWeek: string;
  readonly classesLeft: string;
  readonly actions: string;
  readonly showingOf: string;
  readonly previous: string;
  readonly next: string;
  readonly viewProfile: string;
  readonly viewHistory: string;
  readonly noEntries: string;
  readonly weeklyHours: string;
  readonly enrollmentStatus: string;
  readonly statusLabels: Record<StudentAccountStatus, string>;
  readonly enrollmentLabels: Record<StudentEnrollmentStatus, string>;
}

export interface StudentDirectoryDataGridLabels {
  readonly index: string;
  readonly student: string;
  readonly email: string;
  readonly status: string;
  readonly hoursPerWeek: string;
  readonly classesLeft: string;
  readonly actions: string;
  readonly showingOf: string;
  readonly previous: string;
  readonly next: string;
  readonly viewProfile: string;
  readonly viewHistory: string;
  readonly noEntries: string;
  readonly statusLabels: Record<StudentAccountStatus, string>;
}

export interface StudentDirectoryCardListLabels {
  readonly weeklyHours: string;
  readonly enrollmentStatus: string;
  readonly classesLeft: string;
  readonly viewProfile: string;
  readonly statusLabels: Record<StudentAccountStatus, string>;
  readonly enrollmentLabels: Record<StudentEnrollmentStatus, string>;
}

export type StudentDirectoryCardLabels = StudentDirectoryCardListLabels;
