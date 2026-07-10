"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Alert, Box, Chip, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppDataGrid, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import { LocalizedStringDisplay } from "@/frontend/components/ui/display";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import {
  deleteMeetingProviderMutationDocument,
  meetingProvidersQueryDocument,
} from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import { CreateMeetingProviderDialog } from "@/frontend/views/dashboard/admin/meeting-providers/CreateMeetingProviderDialog";
import { DeleteMeetingProviderDialog } from "@/frontend/views/dashboard/admin/meeting-providers/DeleteMeetingProviderDialog";
import { EditMeetingProviderDialog } from "@/frontend/views/dashboard/admin/meeting-providers/EditMeetingProviderDialog";

export function MeetingProvidersContainer() {
  const t = useTranslations("dashboard.meetingProviders");
  const [createOpen, setCreateOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<MeetingProviderFieldsFragment | null>(null);
  const [deleteProvider, setDeleteProvider] = useState<MeetingProviderFieldsFragment | null>(null);

  const { data, loading, refetch } = useQuery(meetingProvidersQueryDocument, {
    variables: { activeOnly: false },
  });
  const [deleteMeetingProvider] = useMutation(deleteMeetingProviderMutationDocument);

  const rows = useMemo(() => data?.meetingProviders ?? [], [data?.meetingProviders]);

  const columns = useMemo<GridColDef<MeetingProviderFieldsFragment>[]>(
    () => [
      {
        field: "slug",
        headerName: t("columns.slug"),
        flex: 1,
        minWidth: 140,
      },
      {
        field: "name",
        headerName: t("columns.name"),
        flex: 1.5,
        minWidth: 180,
        renderCell: ({ row }) => <LocalizedStringDisplay value={row.name} />,
      },
      {
        field: "isActive",
        headerName: t("columns.active"),
        width: 120,
        renderCell: ({ value }) => (
          <Chip size="small" color={value ? "success" : "default"} label={value ? t("active") : t("inactive")} />
        ),
      },
      {
        field: "actions",
        headerName: t("columns.actions"),
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" aria-label={t("edit")} onClick={() => setEditProvider(row)}>
              <EditOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={t("delete")} onClick={() => setDeleteProvider(row)}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [t]
  );

  return (
    <RequirePermission permissions={AppPermission.MeetingProvidersManageCatalog}>
      <PageContainer>
        <PageHeader
          title={t("pageTitle")}
          subtitle={t("pageSubtitle")}
          actions={
            <PrimaryPageAction onClick={() => setCreateOpen(true)} startIcon={<AddOutlined />}>
              {t("addProvider")}
            </PrimaryPageAction>
          }
        />
        {!loading && rows.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Stack spacing={0.5}>
              <Box sx={{ typography: "titleSm" }}>{t("emptyCatalogTitle")}</Box>
              <Box sx={{ typography: "bodySm" }}>{t("emptyCatalogBody")}</Box>
            </Stack>
          </Alert>
        ) : null}
        <Box sx={{ height: 560 }}>
          <AppDataGrid rows={rows} columns={columns} loading={loading} getRowId={row => row.id ?? ""} />
        </Box>

        <CreateMeetingProviderDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={async () => {
            setCreateOpen(false);
            await refetch();
          }}
        />
        <EditMeetingProviderDialog
          open={Boolean(editProvider)}
          provider={editProvider}
          onClose={() => setEditProvider(null)}
          onSaved={async () => {
            setEditProvider(null);
            await refetch();
          }}
        />
        <DeleteMeetingProviderDialog
          open={Boolean(deleteProvider)}
          provider={deleteProvider}
          onClose={() => setDeleteProvider(null)}
          onConfirm={async () => {
            if (!deleteProvider?.id) return;
            await deleteMeetingProvider({ variables: { id: deleteProvider.id } });
            setDeleteProvider(null);
            await refetch();
          }}
        />
      </PageContainer>
    </RequirePermission>
  );
}
