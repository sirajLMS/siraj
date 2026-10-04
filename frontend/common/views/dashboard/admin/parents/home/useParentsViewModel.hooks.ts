"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { parentDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents/parent-directory.documents";
import { useParentsStore } from "@/frontend/common/stores/parentsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { exportParentDirectory } from "@/frontend/common/utils/excel-export/parent-directory-export";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import type {
  ParentDirectoryExportLabels,
  ParentDirectoryRow,
  ParentsViewModel,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import type { ParentsDirectoryLabelsBySection } from "@/frontend/common/views/dashboard/admin/parents/home/types/parentsDirectory.types";
import { buildDirectoryQueryVariables } from "@/frontend/common/views/dashboard/admin/parents/home/useParentsViewModel.helpers";
import { useRouter } from "@/shared/i18n/navigation";

export function useParentPermissionGates(): Pick<ParentsViewModel, "canParentsCreate" | "canParentManageStatus"> {
  // Read the user's permissions once in the ViewModel and expose boolean gates so tier
  // views do not import `RequirePermission` or call `useUserStore()` directly.
  const hasPermission = useUserStore(state => state.hasPermission);
  const canParentsCreate = hasPermission(AppPermission.ParentsCreate);
  const canParentManageStatus = hasPermission(AppPermission.ParentManageStatus);
  return { canParentsCreate, canParentManageStatus };
}

export function useParentsDirectoryQuery() {
  const { searchQuery, page, pageSize, lifecycleStatusFilter } = useParentsStore();
  const variables = buildDirectoryQueryVariables(searchQuery, pageSize, page, lifecycleStatusFilter);
  return useQuery(parentDirectoryQueryDocument, {
    variables,
    fetchPolicy: "cache-and-network",
  });
}

export function useParentHandlers(
  rows: readonly ParentDirectoryRow[],
  labelsBySection: ParentsDirectoryLabelsBySection
): Pick<ParentsViewModel, "onAddParent" | "onOpenSettings" | "onSearch" | "onPageChange" | "onFilter" | "onExport"> {
  const router = useRouter();
  const { setSearchQuery, setPage, setFilterPanelOpen, filterPanelOpen } = useParentsStore();

  const onAddParent = () => {
    router.push("/parents/onboarding");
  };

  const onOpenSettings = (id: string) => {
    const row = rows.find(r => r.id === id);
    const href = profileHrefForParent({ userId: row?.userId, parentId: id });
    if (href) {
      router.push(href);
    }
  };

  const onSearch = (query: string) => {
    setSearchQuery(query);
  };

  const onPageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage]
  );

  const onFilter = useCallback(() => {
    setFilterPanelOpen(!filterPanelOpen);
  }, [filterPanelOpen, setFilterPanelOpen]);

  const onExport = useCallback(() => {
    const { shell, columns } = labelsBySection;
    const exportLabels: ParentDirectoryExportLabels = {
      pageTitle: shell.pageTitle,
      table: {
        index: columns.index,
        name: columns.name,
        email: columns.email,
        time: columns.time,
        status: columns.status,
        unpaidInvoices: columns.unpaidInvoices,
        statusLabels: columns.statusLabels,
      },
    };
    void exportParentDirectory({ rows, labels: exportLabels });
  }, [rows, labelsBySection]);

  return { onAddParent, onOpenSettings, onSearch, onPageChange, onFilter, onExport };
}
