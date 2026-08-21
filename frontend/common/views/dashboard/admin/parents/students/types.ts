import { type StudentDirectoryRowFragment, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";

export enum StudentEnrollmentStatus {
  REGULAR = "regular",
  PROSPECT = "prospect",
  WITHDRAWN = "withdrawn",
}

export const STUDENT_STATUS_TO_ACCOUNT_STATUS: Record<StudentStatus, StudentAccountStatus> = {
  [StudentStatus.Regular]: "regular",
  [StudentStatus.Deactivated]: "deactivated",
  [StudentStatus.OnLeave]: "on_leave",
  [StudentStatus.Suspended]: "suspended",
  [StudentStatus.OnTrial]: "on_trial",
};

export type StudentAccountStatus = "deactivated" | "regular" | "on_leave" | "suspended" | "on_trial";

export type StudentDirectoryRowExtended = Readonly<StudentDirectoryRowFragment> & {
  readonly index: number;
  readonly accountStatus: StudentAccountStatus;
  readonly enrollmentStatus: StudentEnrollmentStatus;
  readonly isDeactivated?: boolean;
};

/** Shared directory labels reused by both {@link StudentsViewLabels} and {@link StudentDirectoryDataGridLabels}. */
interface StudentDirectorySharedLabels {
  readonly index: string;
  readonly student: string;
  readonly email: string;
  readonly status: string;
  readonly hoursPerWeek: string;
  readonly classesLeft: string;
  readonly actions: string;
  readonly showingOf: (shown: number, total: number) => string;
  readonly previous: string;
  readonly next: string;
  readonly viewProfile: string;
  readonly viewHistory: string;
  readonly noEntries: string;
  readonly statusLabels: Record<StudentAccountStatus, string>;
}

export interface StudentsViewLabels extends StudentDirectorySharedLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly mobileTitle: string;
  readonly searchPlaceholder: string;
  readonly addStudent: string;
  readonly filters: string;
  readonly globalRecord: string;
  readonly weeklyHours: string;
  readonly enrollmentStatus: string;
  readonly enrollmentLabels: Record<StudentEnrollmentStatus, string>;
}

export type StudentDirectoryDataGridLabels = StudentDirectorySharedLabels;

export interface StudentDirectoryCardListLabels {
  readonly weeklyHours: string;
  readonly enrollmentStatus: string;
  readonly classesLeft: string;
  readonly viewProfile: string;
  readonly statusLabels: Record<StudentAccountStatus, string>;
  readonly enrollmentLabels: Record<StudentEnrollmentStatus, string>;
}

export type StudentDirectoryCardLabels = StudentDirectoryCardListLabels;
