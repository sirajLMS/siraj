"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Alert, Box, Chip, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import {
  AppDataGrid,
  BaseDeleteDialog,
  FormErrorSnackbar,
  FormSuccessSnackbar,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
} from "@/frontend/common/components/ui";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  deleteMeetingProviderMutationDocument,
  meetingProvidersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { logger } from "@/frontend/common/utils/logger";
import { CreateMeetingProviderDialog } from "@/frontend/common/views/dashboard/admin/meeting-providers/CreateMeetingProviderDialog";
import { EditMeetingProviderDialog } from "@/frontend/common/views/dashboard/admin/meeting-providers/EditMeetingProviderDialog";
import { useAppLocale, useAppTranslation } from "@/shared/locale/client";
import type { MeetingProvidersLabels } from "@/shared/locale/types/dashboard/meeting-providers/main";

type MeetingProviderLabels = {
  readonly slug: string;
  readonly name: string;
  readonly active: string;
  readonly inactive: string;
  readonly actions: string;
  readonly edit: string;
  readonly delete: string;
};

function buildMeetingProviderColumns(
  labels: MeetingProviderLabels,
  onEdit: (row: MeetingProviderFieldsFragment) => void,
  onDelete: (row: MeetingProviderFieldsFragment) => void
): GridColDef<MeetingProviderFieldsFragment>[] {
  return [
    {
      field: "slug",
      headerName: labels.slug,
      flex: 1,
      minWidth: 140,
    },
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

function MeetingProvidersEmptyState({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Stack spacing={0.5}>
        <Box sx={{ typography: "titleSm" }}>{title}</Box>
        <Box sx={{ typography: "bodySm" }}>{body}</Box>
      </Stack>
    </Alert>
  );
}

function useNotificationState() {
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

type MeetingProvidersViewProps = {
  readonly t: MeetingProvidersLabels;
  readonly locale: string;
  readonly rows: MeetingProviderFieldsFragment[];
  readonly columns: GridColDef<MeetingProviderFieldsFragment>[];
  readonly loading: boolean;
  readonly createOpen: boolean;
  readonly editProvider: MeetingProviderFieldsFragment | null;
  readonly deleteProvider: MeetingProviderFieldsFragment | null;
  readonly deleting: boolean;
  readonly notifications: ReturnType<typeof useNotificationState>;
  readonly onCreateOpen: () => void;
  readonly onCreateClose: () => void;
  readonly onCreateSaved: () => Promise<void>;
  readonly onEditClose: () => void;
  readonly onEditSaved: () => Promise<void>;
  readonly onDeleteClose: () => void;
  readonly onDeleteConfirm: () => Promise<void>;
};

function MeetingProvidersView({
  t,
  locale,
  rows,
  columns,
  loading,
  createOpen,
  editProvider,
  deleteProvider,
  deleting,
  notifications,
  onCreateOpen,
  onCreateClose,
  onCreateSaved,
  onEditClose,
  onEditSaved,
  onDeleteClose,
  onDeleteConfirm,
}: Readonly<MeetingProvidersViewProps>) {
  return (
    <RequirePermission permissions={AppPermission.MeetingProvidersManageCatalog}>
      <PageContainer>
        <PageHeader
          title={t.pageTitle}
          subtitle={t.pageSubtitle}
          actions={
            <PrimaryPageAction onClick={onCreateOpen} startIcon={<AddOutlined />}>
              {t.addProvider}
            </PrimaryPageAction>
          }
        />
        {!loading && rows.length === 0 ? (
          <MeetingProvidersEmptyState title={t.emptyCatalogTitle} body={t.emptyCatalogBody} />
        ) : null}
        <Box sx={{ height: 560 }}>
          <AppDataGrid rows={rows} columns={columns} loading={loading} getRowId={row => row.id ?? ""} />
        </Box>

        <CreateMeetingProviderDialog
          open={createOpen}
          onClose={onCreateClose}
          onSaved={onCreateSaved}
          onError={notifications.showError}
        />
        <EditMeetingProviderDialog
          open={Boolean(editProvider)}
          provider={editProvider}
          onClose={onEditClose}
          onSaved={onEditSaved}
          onError={notifications.showError}
        />
        <BaseDeleteDialog
          open={Boolean(deleteProvider)}
          onClose={onDeleteClose}
          onConfirm={onDeleteConfirm}
          isLoading={deleting}
          title={t.deleteTitle}
          body={`${t.deleteConfirm} ${resolveLocalizedString(
            (deleteProvider?.name as LocalizedString | null | undefined) ?? null,
            locale
          )}`}
          cancelLabel={t.cancel}
          confirmLabel={t.delete}
        />

        <FormErrorSnackbar
          open={notifications.errorOpen}
          message={notifications.errorMsg}
          onClose={notifications.closeError}
        />
        <FormSuccessSnackbar
          open={notifications.successOpen}
          message={notifications.successMsg}
          onClose={notifications.closeSuccess}
        />
      </PageContainer>
    </RequirePermission>
  );
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

  const labels = useMemo<MeetingProviderLabels>(
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

  const columns = useMemo(() => buildMeetingProviderColumns(labels, setEditProvider, setDeleteProvider), [labels]);

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
      onEditClose={() => setEditProvider(null)}
      onEditSaved={handleEditSaved}
      onDeleteClose={() => setDeleteProvider(null)}
      onDeleteConfirm={handleDeleteConfirm}
    />
  );
}
