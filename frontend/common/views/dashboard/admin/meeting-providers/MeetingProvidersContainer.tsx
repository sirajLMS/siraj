"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useMemo, useState } from "react";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  deleteMeetingProviderMutationDocument,
  meetingProvidersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { logger } from "@/frontend/common/utils/logger";
import { MeetingProvidersView } from "@/frontend/common/views/dashboard/admin/meeting-providers/meetingProvidersView";
import type { MeetingProvidersNotificationState } from "@/frontend/common/views/dashboard/admin/meeting-providers/types";
import { useAppLocale, useAppTranslation } from "@/shared/locale";

type MeetingProviderColumnLabels = {
  readonly slug: string;
  readonly name: string;
  readonly active: string;
  readonly inactive: string;
  readonly actions: string;
  readonly edit: string;
  readonly delete: string;
};

function buildMeetingProviderColumns(
  labels: MeetingProviderColumnLabels,
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
      renderCell: ({ row }) => row.name,
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

export function MeetingProvidersContainer() {
  const t = useAppTranslation().dashboardTranslations.meetingProviders;
  const locale = useAppLocale();
  const [createOpen, setCreateOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const [deleteProvider, setDeleteProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const notifications = useNotificationState();

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

  const columnLabels = useMemo<MeetingProviderColumnLabels>(
    () => ({
      slug: t.columns.slug,
      name: t.columns.name,
      active: t.active,
      inactive: t.inactive,
      actions: t.columns.actions,
      edit: t.edit,
      delete: t.delete,
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

  return (
    <MeetingProvidersView
      t={t}
      locale={locale}
      rows={rows}
      columns={columns}
      loading={loading}
      createOpen={createOpen}
      editProvider={editProvider}
      deleteProvider={deleteProvider}
      deleting={deleting}
      notifications={notifications}
      onCreateOpen={() => setCreateOpen(true)}
      onCreateClose={() => setCreateOpen(false)}
      onCreateSaved={handleCreateSaved}
      onEditRow={setEditProvider}
      onEditClose={() => setEditProvider(null)}
      onEditSaved={handleEditSaved}
      onDeleteRow={setDeleteProvider}
      onDeleteClose={() => setDeleteProvider(null)}
      onDeleteConfirm={handleDeleteConfirm}
    />
  );
}
