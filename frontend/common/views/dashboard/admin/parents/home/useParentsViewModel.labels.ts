import type {
  ParentAccountStatusKey,
  ParentLifecycleStatus,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import type { ParentsDirectoryLabelsBySection } from "@/frontend/common/views/dashboard/admin/parents/home/types/parentsDirectory.types";
import type { ParentsDirectoryLabels } from "@/shared/locale/types/dashboard/parents";

export function buildLabelsBySection(t: ParentsDirectoryLabels): ParentsDirectoryLabelsBySection {
  const statusLabels: Record<ParentLifecycleStatus, string> = {
    regular: t.metrics.regular,
    on_leave: t.metrics.onLeave,
    suspended: t.metrics.suspended,
    on_trial: t.metrics.onTrial,
  };

  const accountStatusLabels: Record<ParentAccountStatusKey, string> = {
    activated: t.accountStatus.activated,
    deactivated: t.accountStatus.deactivated,
  };

  return {
    shell: {
      pageTitle: t.pageTitle,
      pageSubtitle: t.pageSubtitle,
      records: t.records,
      noEntries: t.noEntries,
    },
    filters: {
      searchPlaceholder: t.searchPlaceholder,
      filterLabel: t.actions.filter,
      clearFilters: t.actions.clearFilters,
      statusLabels,
    },
    columns: {
      index: t.table.index,
      image: t.table.image,
      name: t.table.name,
      email: t.table.email,
      time: t.table.time,
      status: t.table.status,
      accountStatus: t.table.accountStatus,
      unpaidInvoices: t.table.unpaidInvoices,
      unpaidCount: t.card.unpaidCount,
      invoicesCleared: t.card.invoicesCleared,
      options: t.table.options,
      noEntries: t.noEntries,
      statusLabels,
      accountStatusLabels,
      manageLifecycle: t.actions.manageLifecycle,
    },
    card: {
      guardianOf: t.card.guardianOf,
      unpaidCount: t.card.unpaidCount,
      invoicesCleared: t.card.invoicesCleared,
      statusLabels,
      accountStatusLabels,
    },
    actions: {
      addParent: t.actions.addParent,
      export: t.actions.export,
      manageLifecycle: t.actions.manageLifecycle,
      accountStatusLabels,
    },
  };
}
