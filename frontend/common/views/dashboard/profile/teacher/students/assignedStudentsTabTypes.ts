import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { AssignedStudentsRow } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsRowTypes";
import type {
  AssignedStudentsColumnLabels,
  AssignedStudentsListShellLabels,
} from "@/frontend/common/views/dashboard/profile/teacher/students/types/assignedStudentsList.types";

/**
 * Shared ViewModel contract for AssignedStudentsTab tier variants.
 *
 * The ViewModel owns the class filter state and the rows → AssignedStudentsRow
 * transformation; list primitives own the pager. The mobile/desktop variants
 * receive computed values (all filtered rows plus the client pagination
 * options) and remain pure-presentational.
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
  readonly pagination: ListPaginationOptions;
}
