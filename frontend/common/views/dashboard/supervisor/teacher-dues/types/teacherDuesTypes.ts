import type { CurrencyCode, TeacherDueStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SupervisorTeacherDuesLabels } from "@/shared/locale";

export interface TeacherDueRow {
  readonly id: string;
  readonly teacherId: string;
  readonly classInstanceId: string;
  readonly studentId: string;
  readonly hours: string;
  readonly amount: string;
  readonly currency: CurrencyCode | null;
  readonly status: TeacherDueStatus | null;
  readonly approvedAt: string;
  readonly teacherPaymentId: string;
}

export interface TeacherDuesViewModel {
  readonly rows: readonly TeacherDueRow[];
  readonly loading: boolean;
  readonly markingPaid: boolean;
  readonly selectedDueIds: string[];
  readonly labels: SupervisorTeacherDuesLabels;
  readonly onSelectDues: (ids: string[]) => void;
  readonly onToggleDue: (id: string) => void;
  readonly onMarkPaid: (dueIds: string[]) => void;
}

export type UseTeacherDuesViewModelProps = TeacherDuesViewModel;
