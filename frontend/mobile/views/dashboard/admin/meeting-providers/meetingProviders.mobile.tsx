"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Alert, Box, Chip, IconButton, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { CreateMeetingProviderDialog } from "@/frontend/common/views/dashboard/admin/meeting-providers/CreateMeetingProviderDialog";
import { EditMeetingProviderDialog } from "@/frontend/common/views/dashboard/admin/meeting-providers/EditMeetingProviderDialog";
import type { MeetingProvidersViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/types";
import {
  MobileBaseDeleteDialog,
  MobileCardList,
  MobileCardListItem,
  MobileFab,
  MobileFormErrorSnackbar,
  MobileFormSuccessSnackbar,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";

function MeetingProvidersMobileEmptyState({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <Alert severity="info" sx={{ mx: 2, mb: 2 }}>
      <Stack spacing={0.5}>
        <Box sx={{ typography: "titleSm" }}>{title}</Box>
        <Box sx={{ typography: "bodySm" }}>{body}</Box>
      </Stack>
    </Alert>
  );
}

interface MobileProviderRowProps {
  readonly row: MeetingProviderFieldsFragment;
  readonly activeLabel: string;
  readonly inactiveLabel: string;
  readonly editLabel: string;
  readonly deleteLabel: string;
  readonly onEdit: (row: MeetingProviderFieldsFragment) => void;
  readonly onDelete: (row: MeetingProviderFieldsFragment) => void;
}

function MobileProviderRow({
  row,
  activeLabel,
  inactiveLabel,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: MobileProviderRowProps) {
  const isActive = Boolean(row.isActive);
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ paddingBlock: 2, paddingInline: 2, width: "100%", overflow: "hidden" }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ typography: "titleMd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <LocalizedStringDisplay value={row.name} />
            </Box>
            <Box sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary, mt: 0.25 }}>{row.slug}</Box>
          </Box>
          <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
            <Chip
              size="small"
              color={isActive ? "success" : "default"}
              label={isActive ? activeLabel : inactiveLabel}
            />
            <IconButton size="small" aria-label={editLabel} onClick={() => onEdit(row)}>
              <EditOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={deleteLabel} onClick={() => onDelete(row)}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </MobileCardListItem>
  );
}

export function MeetingProvidersMobileView({
  t,
  locale,
  rows,
  loading,
  createOpen,
  editProvider,
  deleteProvider,
  deleting,
  notifications,
  onCreateOpen,
  onCreateClose,
  onCreateSaved,
  onEditRow,
  onEditClose,
  onEditSaved,
  onDeleteRow,
  onDeleteClose,
  onDeleteConfirm,
}: Readonly<MeetingProvidersViewProps>) {
  const renderItem = (row: MeetingProviderFieldsFragment): ReactNode => (
    <MobileProviderRow
      row={row}
      activeLabel={t.active}
      inactiveLabel={t.inactive}
      editLabel={t.edit}
      deleteLabel={t.delete}
      onEdit={onEditRow}
      onDelete={onDeleteRow}
    />
  );

  return (
    <RequirePermission permissions={AppPermission.MeetingProvidersManageCatalog}>
      <MobilePageContainer>
        <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

        {!loading && rows.length === 0 ? (
          <MeetingProvidersMobileEmptyState title={t.emptyCatalogTitle} body={t.emptyCatalogBody} />
        ) : null}

        <MobileCardList
          rows={rows as readonly MeetingProviderFieldsFragment[]}
          loading={loading}
          emptyMessage={t.emptyCatalogBody}
          gap={1.5}
          layout="edge-to-edge"
          getKey={row => row.id ?? ""}
          renderItem={renderItem}
        />

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
        <MobileBaseDeleteDialog
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

        <MobileFormErrorSnackbar
          open={notifications.errorOpen}
          message={notifications.errorMsg}
          onClose={notifications.closeError}
        />
        <MobileFormSuccessSnackbar
          open={notifications.successOpen}
          message={notifications.successMsg}
          onClose={notifications.closeSuccess}
        />

        <MobileFab icon={<AddOutlined />} label={t.addProvider} onClick={onCreateOpen} />
      </MobilePageContainer>
    </RequirePermission>
  );
}
