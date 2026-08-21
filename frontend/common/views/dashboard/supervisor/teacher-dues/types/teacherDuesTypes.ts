import type { CurrencyCode, RateSource, TeacherDueStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SupervisorTeacherDuesLabels } from "@/shared/locale";

export interface TeacherDueRow {
  readonly id: string;
  readonly teacherId: string;
  readonly teacherName: string;
  readonly classInstanceId: string;
  readonly classDate: string;
  readonly teacherUserId: string;
  readonly teacherAvatarUrl: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly studentAvatarUrl: string;
  readonly hours: string;
  readonly amount: string;
  readonly currency: CurrencyCode | null;
  readonly status: TeacherDueStatus | null;
  readonly approvedAt: string;
  readonly teacherPaymentId: string;
  readonly rateSource: RateSource | null;
}

export interface TeacherDuesSnackbarState {
  readonly open: boolean;
  readonly message: string;
  readonly severity: "success" | "error";
}

export interface TeacherDuesViewModel {
  readonly rows: readonly TeacherDueRow[];
  readonly loading: boolean;
  readonly markingPaid: boolean;
  readonly canMarkPaid: boolean;
  readonly selectedDueIds: string[];
  readonly snackbar: TeacherDuesSnackbarState;
  readonly labels: SupervisorTeacherDuesLabels;
  readonly onSelectDues: (ids: string[]) => void;
  readonly onToggleDue: (id: string) => void;
  readonly onMarkPaid: (dueIds: string[]) => void;
  readonly onCloseSnackbar: () => void;
}

export type UseTeacherDuesViewModelProps = Record<string, never>;

// Desktop tier presentation prop types (sub-components/column-builders defined in
// `frontend/desktop/views/dashboard/supervisor/teacher-dues/teacherDues.desktop.tsx`).
export type TeacherDuesColumnLabels = Pick<
  TeacherDuesViewModel["labels"],
  | "teacherNameColumn"
  | "classDateColumn"
  | "studentColumn"
  | "hoursColumn"
  | "amountColumn"
  | "currencyColumn"
  | "statusColumn"
  | "approvedDateColumn"
  | "markAsPaidButton"
  | "rateSourceColumn"
  | "rateSourceOverride"
  | "rateSourceRecurring"
  | "rateSourceSubject"
  | "rateSourceTeacher"
  | "statusPending"
  | "statusPaid"
>;

export interface TeacherDuesColumnParams {
  readonly labels: TeacherDuesColumnLabels;
  readonly canMarkPaid: boolean;
  readonly markingPaid: boolean;
  readonly onMarkPaid: (dueIds: string[]) => void;
}
