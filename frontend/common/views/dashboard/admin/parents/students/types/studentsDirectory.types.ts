import type {
  StudentDirectoryCardListLabels,
  StudentDirectoryDataGridLabels,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type { StudentDirectoryLabels } from "@/shared/locale";

export type StudentsDirectoryShellLabels = Pick<
  StudentDirectoryLabels,
  "pageTitle" | "pageSubtitle" | "mobileTitle" | "globalRecord" | "noEntries"
>;

export type StudentsDirectoryFilterLabels = Pick<StudentDirectoryLabels, "searchPlaceholder" | "filters">;

export type StudentsDirectoryActionLabels = Pick<StudentDirectoryLabels, "addStudent"> & {
  readonly viewProfile: string;
  readonly viewHistory: string;
};

export type StudentsDirectoryColumnLabels = StudentDirectoryDataGridLabels;

export type StudentsDirectoryCardLabels = StudentDirectoryCardListLabels;

export interface StudentsLabelsBySection {
  readonly shell: StudentsDirectoryShellLabels;
  readonly filters: StudentsDirectoryFilterLabels;
  readonly actions: StudentsDirectoryActionLabels;
  readonly columns: StudentsDirectoryColumnLabels;
  readonly cards: StudentsDirectoryCardLabels;
}
