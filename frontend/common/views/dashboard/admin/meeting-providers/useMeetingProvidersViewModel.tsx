"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { DeleteOutlined, EditOutlined, VideocamOutlined } from "@mui/icons-material";
import { Avatar, Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
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
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

function buildMeetingProviderColumns(
  labels: MeetingProvidersViewLabels,
  onEdit: (row: MeetingProviderFieldsFragment) => void,
  onDelete: (row: MeetingProviderFieldsFragment) => void
): GridColDef<MeetingProviderFieldsFragment>[] {
  return [
    {
      field: "logoUrl",
      headerName: labels.logo ?? "Logo",
      width: 72,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          {row.logoUrl ? (
            <Avatar
              src={row.logoUrl}
              alt={row.slug ?? undefined}
              variant="rounded"
              sx={{ width: 36, height: 36, "& img": { objectFit: "contain" } }}
            />
          ) : (
            <Avatar variant="rounded" sx={{ width: 36, height: 36 }}>
              <VideocamOutlined fontSize="small" />
            </Avatar>
          )}
        </Box>
      ),
    },
    {
      field: "name",
      headerName: labels.name,
      flex: 1.2,
      minWidth: 150,
      renderCell: ({ row }) => <LocalizedStringDisplay value={row.name} />,
    },
    {
      field: "description",
      headerName: labels.description ?? "Description",
      flex: 1.5,
      minWidth: 180,
      renderCell: ({ row }) => (row.description ? <LocalizedStringDisplay value={row.description} /> : "—"),
    },
    {
      field: "instructions",
      headerName: labels.instructions ?? "Instructions",
      flex: 1.5,
      minWidth: 180,
      renderCell: ({ row }) => (row.instructions ? <LocalizedStringDisplay value={row.instructions} /> : "—"),
    },
    {
      field: "urlAllowlist",
      headerName: labels.urlAllowlist ?? "Allowed Hosts",
      flex: 1.5,
      minWidth: 180,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5, py: 1 }}>
          {(row.urlAllowlist ?? []).map(host => (
            <Chip key={host} size="small" variant="outlined" label={host} />
          ))}
        </Stack>
      ),
    },
    {
      field: "urlExample",
      headerName: labels.urlExample ?? "Example URL",
      flex: 1.2,
      minWidth: 160,
      renderCell: ({ row }) =>
        row.urlExample ? (
          <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {row.urlExample}
          </Typography>
        ) : (
          "—"
        ),
    },
    {
      field: "isActive",
      headerName: labels.active,
      width: 100,
      renderCell: ({ value }) => (
        <Chip size="small" color={value ? "success" : "default"} label={value ? labels.active : labels.inactive} />
      ),
    },
    {
      field: "actions",
      headerName: labels.actions,
      width: 100,
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

export type MeetingProvidersViewModel = MeetingProvidersViewProps & {
  readonly canManageCatalog: boolean;
};

export type UseMeetingProvidersViewModelProps = Record<string, never>;

export function useMeetingProvidersViewModel(
  _props: Readonly<UseMeetingProvidersViewModelProps>
): MeetingProvidersViewModel {
  const router = useRouter();
  const t = useAppTranslation(Translation.Dashboard.MeetingProviders);
  const locale = useAppLocale();

  const [deleteProvider, setDeleteProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const notifications = useNotificationState();
  const toolpadNotifications = useNotifications();

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
      logo: t.columns.logo,
      slug: t.columns.slug,
      name: t.columns.name,
      description: t.columns.description,
      instructions: t.columns.instructions,
      urlAllowlist: t.columns.urlAllowlist,
      urlExample: t.columns.urlExample,
      capabilities: t.columns.capabilities,
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
      supportsUsername: t.fields.supportsUsername,
      supportsPassword: t.fields.supportsPassword,
      supportsTenantId: t.fields.supportsTenantId,
    }),
    [t]
  );

  const handleEditRow = useCallback(
    (row: MeetingProviderFieldsFragment) => {
      if (row.id) {
        router.push(`/meeting-providers/edit?id=${row.id}`);
      }
    },
    [router]
  );

  const columns = useMemo(
    () => buildMeetingProviderColumns(columnLabels, handleEditRow, setDeleteProvider),
    [columnLabels, handleEditRow]
  );

  const handleCreateOpen = useCallback(() => {
    router.push("/meeting-providers/create");
  }, [router]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteProvider?.id) return;
    try {
      await deleteMeetingProvider({ variables: { id: deleteProvider.id } });
      setDeleteProvider(null);
      await refetch();
      notifications.showSuccess(t.deleteSuccess);
      toolpadNotifications.show(t.deleteSuccess, { severity: "success", autoHideDuration: 3000 });
    } catch {
      notifications.showError(t.operationFailed);
      toolpadNotifications.show(t.operationFailed, { severity: "error", autoHideDuration: 4000 });
    }
  }, [deleteProvider, deleteMeetingProvider, refetch, notifications, toolpadNotifications, t]);

  return {
    t: columnLabels,
    locale,
    rows,
    columns,
    loading,
    createOpen: false,
    editProvider: null,
    deleteProvider,
    deleting,
    notifications,
    onCreateOpen: handleCreateOpen,
    onCreateClose: () => {},
    onCreateSaved: () => {},
    onEditRow: handleEditRow,
    onEditClose: () => {},
    onEditSaved: () => {},
    onDeleteRow: setDeleteProvider,
    onDeleteClose: () => setDeleteProvider(null),
    onDeleteConfirm: handleDeleteConfirm,
    canManageCatalog,
  };
}
