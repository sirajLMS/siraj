"use client";

import { AddOutlined, DeleteOutlined, EditOutlined, VideocamOutlined } from "@mui/icons-material";
import { Alert, Avatar, Box, Chip, IconButton, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { MeetingProvidersViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/types";
import {
  MobileBaseDeleteDialog,
  MobileCardList,
  MobileCardListItem,
  MobileFab,
  MobileFormErrorSnackbar,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

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
  readonly labels: MeetingProvidersViewProps["t"];
  readonly onEdit: (row: MeetingProviderFieldsFragment) => void;
  readonly onDelete: (row: MeetingProviderFieldsFragment) => void;
}

function MobileProviderRow({ row, labels, onEdit, onDelete }: MobileProviderRowProps) {
  const isActive = Boolean(row.isActive);
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ p: 2, width: "100%", overflow: "hidden" }}>
        <Stack spacing={1.5}>
          {/* Header Row */}
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0, flex: 1 }}>
              {row.logoUrl ? (
                <Avatar
                  src={row.logoUrl}
                  alt={row.slug ?? undefined}
                  variant="rounded"
                  sx={{ width: 40, height: 40, "& img": { objectFit: "contain" } }}
                />
              ) : (
                <Avatar variant="rounded" sx={{ width: 40, height: 40 }}>
                  <VideocamOutlined fontSize="small" />
                </Avatar>
              )}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ typography: "titleMd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <LocalizedStringDisplay value={row.name} />
                </Box>
                <Box sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>{row.slug}</Box>
              </Box>
            </Stack>

            <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
              <Chip
                size="small"
                color={isActive ? "success" : "default"}
                label={isActive ? labels.active : labels.inactive}
              />
              <IconButton size="small" aria-label={labels.edit} onClick={() => onEdit(row)}>
                <EditOutlined fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label={labels.delete} onClick={() => onDelete(row)}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          {/* Description & Instructions */}
          {row.description ? (
            <LocalizedStringDisplay
              value={row.description}
              typographyVariant="body2"
              sx={theme => ({ color: theme.palette.text.secondary })}
            />
          ) : null}

          {/* Allowed Hosts Chips */}
          {(row.urlAllowlist ?? []).length > 0 ? (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
              {(row.urlAllowlist ?? []).map(host => (
                <Chip key={host} size="small" variant="outlined" label={host} />
              ))}
            </Stack>
          ) : null}

          {/* Capability Flags */}
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {row.fieldSchema?.supportsUsername ? (
              <Chip size="small" color="info" variant="outlined" label={labels.supportsUsername} />
            ) : null}
            {row.fieldSchema?.supportsPassword ? (
              <Chip size="small" color="info" variant="outlined" label={labels.supportsPassword} />
            ) : null}
            {row.fieldSchema?.supportsTenantId ? (
              <Chip size="small" color="info" variant="outlined" label={labels.supportsTenantId} />
            ) : null}
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
