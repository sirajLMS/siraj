import type {
  ParentAccountStatusKey,
  ParentCardListLabels,
  ParentLifecycleStatus,
  ParentsDataGridLabels,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import type { ParentsDirectoryLabels } from "@/shared/locale/types/dashboard/parents";

export type ParentsDirectoryShellLabels = Pick<
  ParentsDirectoryLabels,
  "pageTitle" | "pageSubtitle" | "records" | "noEntries"
>;

export type ParentsDirectoryFilterLabels = Pick<ParentsDirectoryLabels, "searchPlaceholder"> & {
  readonly filterLabel: string;
  readonly clearFilters: string;
  readonly statusLabels: Record<ParentLifecycleStatus, string>;
};

export type ParentsDirectoryColumnLabels = ParentsDataGridLabels;

export type ParentsDirectoryCardLabels = ParentCardListLabels;

export type ParentsDirectoryActionLabels = Pick<ParentsDirectoryLabels["actions"], "addParent" | "manageLifecycle"> & {
  readonly accountStatusLabels: Record<ParentAccountStatusKey, string>;
};

export interface ParentsDirectoryLabelsBySection {
  readonly shell: ParentsDirectoryShellLabels;
  readonly filters: ParentsDirectoryFilterLabels;
  readonly columns: ParentsDirectoryColumnLabels;
  readonly card: ParentsDirectoryCardLabels;
  readonly actions: ParentsDirectoryActionLabels;
}
