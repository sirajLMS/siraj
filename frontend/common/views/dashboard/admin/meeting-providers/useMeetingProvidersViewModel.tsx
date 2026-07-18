"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Chip, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useMemo, useState } from "react";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display/localizedStringDisplay/LocalizedStringDisplay";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  deleteMeetingProviderMutationDocument,
  meetingProvidersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  MeetingProvidersNotificationState,
  MeetingProvidersViewLabels,
  MeetingProvidersViewProps,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/types";
import { useAppLocale, useAppTranslation } from "@/shared/locale";

function buildMeetingProviderColumns(
  labels: MeetingProvidersColumnLabels,
  onEdit: (row: MeetingProviderFieldsFragment) => void,
  onDelete: (row: MeetingProviderFieldsFragment) => void
): GridColDef<MeetingProviderFieldsFragment>[] {
  return [
    { field: "slug", headerName: labels.slug, flex: 1, minWidth: 140 },
    {
      field: "name",
      headerName: labels.name,
      flex: 1.5,
      minWidth: 180,
      renderCell: ({ row }) => <LocalizedStringDisplay value={row.name} />,
    },
    {
      field: "isActive",
      headerName: labels.active,
      width: 120,
      renderCell: ({ value }) => (
        <Chip size="small" color={value ? "success" : "default"} label={value ? labels.active : labels.inactive} />
      ),
    },
    {
      field: "actions",
      headerName: labels.actions,
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label={labels.edit} onClick={() => onEdit(row)}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={labels.delete} onClick={() => onDelete(row)}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];
}

type MeetingProvidersColumnLabels = {
  readonly slug: string;
  readonly name: string;
  readonly active: string;
  readonly inactive: string;
  readonly actions: string;
  readonly edit: string;
  readonly delete: string;
};

function useNotificationState(): MeetingProvidersNotificationState {
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const showError = useCallback((message: string) => {
    setErrorMsg(message);
    setErrorOpen(true);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMsg(message);
    setSuccessOpen(true);
  }, []);

  const closeError = useCallback(() => setErrorOpen(false), []);
  const closeSuccess = useCallback(() => setSuccessOpen(false), []);

  return { errorOpen, errorMsg, successOpen, successMsg, showError, showSuccess, closeError, closeSuccess };
}

export type MeetingProvidersViewModel = MeetingProvidersViewProps & {
  // NEW FOR PLAN v5: lifted permission boolean per specs.md §3 N3 + §6.1.
  // Tier meeting-providers views no longer import `RequirePermission` or
  // call `useUserStore()` — the Container wraps the View in
  // `<RequirePermission>` and the tier view renders content unconditionally.
  readonly canManageCatalog: boolean;
};

export type UseMeetingProvidersViewModelProps = Record<string, never>;

export function useMeetingProvidersViewModel(
  _props: Readonly<UseMeetingProvidersViewModelProps>
): MeetingProvidersViewModel {
  const t = useAppTranslation().dashboardTranslations.meetingProviders;
  const locale = useAppLocale();
  const [createOpen, setCreateOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const [deleteProvider, setDeleteProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const notifications = useNotificationState();

  // NEW FOR PLAN v5: read the user's permission ONCE in the ViewModel and
  // expose a boolean gate. Tier meeting-providers views no longer import
  // `RequirePermission` or call `useUserStore()` (specs.md §3 N3). The
  // Container also wraps the View in `<RequirePermission>` so unauthorized
  // users see the fallback (not a half-rendered page).
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManageCatalog = hasPermission(AppPermission.MeetingProvidersManageCatalog);

  const { data, loading, refetch } = useQuery(meetingProvidersQueryDocument, {
    variables: { activeOnly: false },
  });
  const [deleteMeetingProvider, { loading: deleting }] = useMutation(deleteMeetingProviderMutationDocument, {
    onError: error => {
      logger.error("Delete meeting provider failed:", { error });
      notifications.showError(t.operationFailed);
    },
  });

  const rows = useMemo(() => data?.meetingProviders ?? [], [data?.meetingProviders]);

  const columnLabels = useMemo<MeetingProvidersViewLabels>(
    () => ({
      slug: t.columns.slug,
      name: t.columns.name,
      active: t.active,
      inactive: t.inactive,
      actions: t.columns.actions,
      edit: t.edit,
      delete: t.delete,
      pageTitle: t.pageTitle,
      pageSubtitle: t.pageSubtitle,
      emptyCatalogTitle: t.emptyCatalogTitle,
      emptyCatalogBody: t.emptyCatalogBody,
      addProvider: t.addProvider,
      createSuccess: t.createSuccess,
      updateSuccess: t.updateSuccess,
      deleteSuccess: t.deleteSuccess,
      deleteTitle: t.deleteTitle,
      deleteConfirm: t.deleteConfirm,
      cancel: t.cancel,
      operationFailed: t.operationFailed,
    }),
    [t]
  );

  const columns = useMemo(
    () => buildMeetingProviderColumns(columnLabels, setEditProvider, setDeleteProvider),
    [columnLabels]
  );

  const handleCreateSaved = useCallback(async () => {
    setCreateOpen(false);
    await refetch();
    notifications.showSuccess(t.createSuccess);
  }, [refetch, notifications, t]);

  const handleEditSaved = useCallback(async () => {
    setEditProvider(null);
    await refetch();
    notifications.showSuccess(t.updateSuccess);
  }, [refetch, notifications, t]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteProvider?.id) return;
    try {
      await deleteMeetingProvider({ variables: { id: deleteProvider.id } });
      setDeleteProvider(null);
      await refetch();
      notifications.showSuccess(t.deleteSuccess);
    } catch {
      notifications.showError(t.operationFailed);
    }
  }, [deleteProvider, deleteMeetingProvider, refetch, notifications, t]);

  return {
    t: columnLabels,
    locale,
    rows,
    columns,
    loading,
    createOpen,
    editProvider,
    deleteProvider,
    deleting,
    notifications,
    onCreateOpen: () => setCreateOpen(true),
    onCreateClose: () => setCreateOpen(false),
    onCreateSaved: handleCreateSaved,
    onEditRow: setEditProvider,
    onEditClose: () => setEditProvider(null),
    onEditSaved: handleEditSaved,
    onDeleteRow: setDeleteProvider,
    onDeleteClose: () => setDeleteProvider(null),
    onDeleteConfirm: handleDeleteConfirm,
    // NEW FOR PLAN v5: lifted permission boolean consumed by the Container
    // (which wraps the View in `<RequirePermission>`) and tier views.
    canManageCatalog,
  };
}
