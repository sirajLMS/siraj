"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { SessionConfigDeleteDialog } from "@/frontend/common/views/dashboard/settings/tabs/session/components/SessionConfigDeleteDialog";
import { SessionConfigFormDialog } from "@/frontend/common/views/dashboard/settings/tabs/session/components/SessionConfigFormDialog";
import type {
  SessionConfigRow,
  SessionConfigTabViewModel,
} from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";
import { MobileCardList, MobileCardListItem, MobileFab, MobileSectionTitleRow } from "@/frontend/mobile/components/ui";

interface SessionConfigCardProps {
  readonly row: SessionConfigRow;
  readonly labels: SessionConfigTabViewModel["labels"];
  readonly canManage: boolean;
  readonly onEdit: (row: SessionConfigRow) => void;
  readonly onDelete: (row: SessionConfigRow) => void;
}

function SessionConfigCard({ row, labels, canManage, onEdit, onDelete }: SessionConfigCardProps) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ p: 2, width: "100%" }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography sx={{ typography: "titleMd" }}>{row.roleName}</Typography>
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
          </Stack>

          <Stack spacing={0.5}>
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {labels.ttlSecondsColumn}: {row.ttlSeconds}
            </Typography>
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {labels.maxConcurrentSessionsColumn}: {row.maxConcurrentSessions}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </MobileCardListItem>
  );
}

export function SessionConfigTabMobileView({
  rows,
  loading,
  canManage,
  labels,
  formOpen,
  editRow,
  deleteRow,
  isDeleting,
  onAdd,
  onEdit,
  onDelete,
  onFormClose,
  onDeleteClose,
  onSaved,
  onConfirmDelete,
}: Readonly<SessionConfigTabViewModel>) {
  const renderItem = (row: SessionConfigRow): ReactNode => (
    <SessionConfigCard row={row} labels={labels} canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <MobileSectionTitleRow title={labels.title} />

      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, px: 2 }}>
        {labels.subtitle}
      </Typography>

      <MobileCardList
        rows={rows}
        loading={loading}
        emptyMessage={labels.empty}
        gap={1.5}
        layout="edge-to-edge"
        getKey={row => row.id}
        renderItem={renderItem}
        paginationOptions={{ mode: "client" }}
      />

      {canManage ? (
        <>
          <SessionConfigFormDialog
            open={formOpen}
            row={editRow}
            labels={labels}
            onClose={onFormClose}
            onSaved={onSaved}
          />
          <SessionConfigDeleteDialog
            open={deleteRow != null}
            row={deleteRow}
            labels={labels}
            isLoading={isDeleting}
            onClose={onDeleteClose}
            onConfirm={() => {
              void onConfirmDelete();
            }}
          />
          <MobileFab icon={<AddOutlined />} label={labels.addLabel} onClick={onAdd} />
        </>
      ) : null}
    </Box>
  );
}
