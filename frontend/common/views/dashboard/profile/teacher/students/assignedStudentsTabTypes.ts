import type { AssignedStudentsRow } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsRowTypes";
import type {
  AssignedStudentsColumnLabels,
  AssignedStudentsListShellLabels,
} from "@/frontend/common/views/dashboard/profile/teacher/students/types/assignedStudentsList.types";

/**
 * Shared ViewModel contract for AssignedStudentsTab tier variants.
 *
 * The switcher (`AssignedStudentsTab.tsx`) owns the filter/pagination state and
 * the rows → AssignedStudentsRow transformation; the mobile/desktop variants
 * receive computed values and remain pure-presentational.
 */
export interface AssignedStudentsTabViewModel {
  readonly labelsBySection: {
    readonly columns: AssignedStudentsColumnLabels;
    readonly list: AssignedStudentsListShellLabels;
  };
  readonly title: string;
  readonly description: string;
  readonly rows: readonly AssignedStudentsRow[];
  readonly loading: boolean;
  readonly hasError: boolean;
  readonly retryLabel: string;
  readonly errorLabel: string;
  readonly onRetry: () => void;
  readonly empty: { readonly title: string; readonly description: string };
  readonly classFilter: {
    readonly options: readonly string[];
    readonly selected: string;
    readonly onSelect: (className: string) => void;
    readonly allClassesLabel: string;
  };
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalCount: number;
    readonly onPageChange: (page: number) => void;
    readonly onPaginationModelChange: (page: number, pageSize: number) => void;
  };
}
