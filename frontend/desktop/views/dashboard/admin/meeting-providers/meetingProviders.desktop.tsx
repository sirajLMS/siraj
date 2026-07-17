"use client";

import { AddOutlined } from "@mui/icons-material";
import { Alert, Box, Stack } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import {
  AppDataGrid,
  BaseDeleteDialog,
  FormErrorSnackbar,
  FormSuccessSnackbar,
  PrimaryPageAction,
} from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { CreateMeetingProviderDialog } from "@/frontend/common/views/dashboard/admin/meeting-providers/CreateMeetingProviderDialog";
import { EditMeetingProviderDialog } from "@/frontend/common/views/dashboard/admin/meeting-providers/EditMeetingProviderDialog";
import type { MeetingProvidersViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/types";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";

function MeetingProvidersDesktopEmptyState({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Stack spacing={0.5}>
        <Box sx={{ typography: "titleSm" }}>{title}</Box>
        <Box sx={{ typography: "bodySm" }}>{body}</Box>
      </Stack>
    </Alert>
  );
}

export function MeetingProvidersDesktopView({
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
      <DesktopPageContainer>
        <DesktopPageHeader
          title={t.pageTitle}
          subtitle={t.pageSubtitle}
          actions={
            <PrimaryPageAction onClick={onCreateOpen} startIcon={<AddOutlined />}>
              {t.addProvider}
            </PrimaryPageAction>
          }
        />

        {!loading && rows.length === 0 ? (
          <MeetingProvidersDesktopEmptyState title={t.emptyCatalogTitle} body={t.emptyCatalogBody} />
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
      </DesktopPageContainer>
    </RequirePermission>
  );
}
