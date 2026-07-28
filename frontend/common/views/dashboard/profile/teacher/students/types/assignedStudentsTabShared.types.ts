import type { ReactNode } from "react";
import type { AssignedStudentsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabTypes";

/**
 * Slot props supplied by each tier wrapper to `AssignedStudentsTabShared`.
 *
 * The shared scaffold renders the loading state, error Alert, empty state,
 * and the title/description/classFilter UI — only the row list differs:
 * desktop renders an `AssignedStudentsDataGrid`, mobile renders an
 * `AssignedStudentsCardList` wrapped (optionally) in a horizontal scroll
 * row. Callers pass whatever props the list needs (already extracted from
 * {@link AssignedStudentsTabViewModel}) via the `ListView` slot, and
 * optionally wrap the chip row in `ClassFilterWrapper`.
 */
export interface AssignedStudentsTabSlotProps {
  readonly ListView: React.ComponentType<{
    readonly rows: AssignedStudentsTabViewModel["rows"];
    readonly loading: AssignedStudentsTabViewModel["loading"];
    readonly pagination: AssignedStudentsTabViewModel["pagination"];
    readonly labelsBySection: AssignedStudentsTabViewModel["labelsBySection"];
  }>;
  readonly ClassFilterWrapper?: React.ComponentType<{
    readonly children: ReactNode;
  }>;
}
