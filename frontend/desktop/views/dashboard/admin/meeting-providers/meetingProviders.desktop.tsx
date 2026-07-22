"use client";

import { AddOutlined } from "@mui/icons-material";
import { Alert, Box, Stack } from "@mui/material";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { CreateMeetingProviderDialog } from "@/frontend/common/views/dashboard/admin/meeting-providers/CreateMeetingProviderDialog";
import { EditMeetingProviderDialog } from "@/frontend/common/views/dashboard/admin/meeting-providers/EditMeetingProviderDialog";
import type { MeetingProvidersViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/types";
import {
  DesktopAppDataGrid,
  DesktopFormErrorSnackbar,
  DesktopFormSuccessSnackbar,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
} from "@/frontend/desktop/components/ui";
import { DesktopBaseDeleteDialog } from "@/frontend/desktop/components/ui/dialog/DesktopBaseDeleteDialog";
import type { LocalizedString } from "@/shared/types";

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
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          <DesktopPrimaryPageAction onClick={onCreateOpen} startIcon={<AddOutlined />}>
            {t.addProvider}
          </DesktopPrimaryPageAction>
        }
      />

      {!loading && rows.length === 0 ? (
        <MeetingProvidersDesktopEmptyState title={t.emptyCatalogTitle} body={t.emptyCatalogBody} />
      ) : null}

      <Box sx={{ height: 560 }}>
        <DesktopAppDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={row => row.id ?? ""}
          paginationOptions={{ mode: "client" }}
        />
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
      <DesktopBaseDeleteDialog
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

      <DesktopFormErrorSnackbar
        open={notifications.errorOpen}
        message={notifications.errorMsg}
        onClose={notifications.closeError}
      />
      <DesktopFormSuccessSnackbar
        open={notifications.successOpen}
        message={notifications.successMsg}
        onClose={notifications.closeSuccess}
      />
    </DesktopPageContainer>
  );
}
