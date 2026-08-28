"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, FormControlLabel, IconButton, Stack, Switch, Typography } from "@mui/material";
import { SiteContentDialogsShared } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/__shared__/siteContentDialogsShared";
import type {
  SiteContentRow,
  SiteContentSettingsViewModel,
} from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import {
  MobileCardList,
  MobileCardListItem,
  MobilePrimaryPageAction,
  MobileSectionPanel,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";

function SiteContentCard({
  row,
  canManage,
  labels,
  togglingPublishId,
  onEdit,
  onDelete,
  onTogglePublish,
}: Readonly<{
  readonly row: SiteContentRow;
  readonly canManage: boolean;
  readonly labels: SiteContentSettingsViewModel["labels"];
  readonly togglingPublishId: string | null;
  readonly onEdit: (row: SiteContentRow) => void;
  readonly onDelete: (row: SiteContentRow) => void;
  readonly onTogglePublish: (row: SiteContentRow, isPublished: boolean) => Promise<void>;
}>) {
  const contentTypeLabel = row.contentType === "page" ? labels.contentTypePage : row.contentType;

  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ typography: "labelSm", fontWeight: 700, mb: 0.5 }}>{row.title}</Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, mb: 1 }}>
            {labels.slugColumn}: {row.slug}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Chip size="small" variant="outlined" label={`${labels.contentTypeColumn}: ${contentTypeLabel}`} />
            {canManage ? (
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={row.isPublished}
                    disabled={togglingPublishId === row.id}
                    onChange={event => {
                      void onTogglePublish(row, event.target.checked);
                    }}
                  />
                }
                label={row.isPublished ? labels.published : labels.draft}
              />
            ) : (
              <MobileStatusBadge
                category="syncStatus"
                status={row.isPublished ? "success" : "pending"}
                label={row.isPublished ? labels.published : labels.draft}
                size="small"
              />
            )}
          </Stack>
        </Box>
        {canManage ? (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" aria-label={labels.editLabel} onClick={() => onEdit(row)}>
              <EditOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={labels.deleteLabel} onClick={() => onDelete(row)}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Stack>
        ) : null}
      </Box>
    </MobileCardListItem>
  );
}

export function SiteContentSettingsTabMobileView({
  rows,
  loading,
  canManage,
  labels,
  formOpen,
  editRow,
  deleteRow,
  isDeleting,
  togglingPublishId,
  onAdd,
  onEdit,
  onDelete,
  onFormClose,
  onDeleteClose,
  onSaved,
  onConfirmDelete,
  onTogglePublish,
}: Readonly<SiteContentSettingsViewModel>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <MobileSectionPanel
        title={labels.title}
        subTitle={labels.subtitle}
        actions={
          canManage ? (
            <MobilePrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />} fullWidth>
              {labels.addLabel}
            </MobilePrimaryPageAction>
          ) : undefined
        }
      />

      <MobileCardList
        rows={rows}
        loading={loading}
        emptyMessage={labels.empty}
        getKey={row => row.id}
        paginationOptions={{ mode: "client" }}
        layout="edge-to-edge"
        renderItem={row => (
          <SiteContentCard
            row={row}
            canManage={canManage}
            labels={labels}
            togglingPublishId={togglingPublishId}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePublish={onTogglePublish}
          />
        )}
      />

      {canManage ? (
        <SiteContentDialogsShared
          formOpen={formOpen}
          editRow={editRow}
          deleteRow={deleteRow}
          isDeleting={isDeleting}
          labels={labels}
          onFormClose={onFormClose}
          onSaved={onSaved}
          onDeleteClose={onDeleteClose}
          onConfirmDelete={onConfirmDelete}
        />
      ) : null}
    </Box>
  );
}
