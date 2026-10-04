"use client";

import { AddOutlined } from "@mui/icons-material";
import type { ReactNode } from "react";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MeetingProvidersViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/types";
import {
  MobileBaseDeleteDialog,
  MobileCardList,
  MobileFab,
  MobileFormErrorSnackbar,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import {
  MeetingProvidersMobileEmptyState,
  MobileProviderRow,
} from "@/frontend/mobile/views/dashboard/admin/meeting-providers/meetingProviders.parts";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export function MeetingProvidersMobileView({
  t,
  locale,
  rows,
  loading,
  deleteProvider,
  deleting,
  notifications,
  onCreateOpen,
  onEditRow,
  onDeleteRow,
  onDeleteClose,
  onDeleteConfirm,
}: Readonly<MeetingProvidersViewProps>) {
  const renderItem = (row: MeetingProviderFieldsFragment): ReactNode => (
    <MobileProviderRow row={row} labels={t} onEdit={onEditRow} onDelete={onDeleteRow} />
  );

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      {!loading && rows.length === 0 ? (
        <MeetingProvidersMobileEmptyState title={t.emptyCatalogTitle} body={t.emptyCatalogBody} />
      ) : null}

      <MobileCardList
        rows={rows}
        loading={loading}
        emptyMessage={t.emptyCatalogBody}
        gap={1.5}
        layout="edge-to-edge"
        getKey={row => row.id ?? ""}
        renderItem={renderItem}
        paginationOptions={{ mode: "client" }}
      />

      <MobileBaseDeleteDialog
        open={Boolean(deleteProvider)}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
        isLoading={deleting}
        title={t.deleteTitle}
        body={`${t.deleteConfirm} ${resolveLocalizedString(deleteProvider?.name ?? null, locale)}`}
        cancelLabel={t.cancel}
        confirmLabel={t.delete}
      />

      <MobileFormErrorSnackbar
        open={notifications.errorOpen}
        message={notifications.errorMsg}
        onClose={notifications.closeError}
      />
      <FormSuccessSnackbar
        open={notifications.successOpen}
        message={notifications.successMsg}
        onClose={notifications.closeSuccess}
      />

      <MobileFab icon={<AddOutlined />} label={t.addProvider} onClick={onCreateOpen} />
    </MobilePageContainer>
  );
}
