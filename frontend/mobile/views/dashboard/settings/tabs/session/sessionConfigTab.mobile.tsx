"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { SessionConfigDialogsShared } from "@/frontend/common/views/dashboard/settings/tabs/session/__shared__/sessionConfigDialogsShared";
import type {
  SessionConfigRow,
  SessionConfigTabViewModel,
} from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";
import { MobileCardList, MobileCardListItem, MobileFab, MobileSectionPanel } from "@/frontend/mobile/components/ui";

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
      <Box sx={{ width: "100%" }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography sx={{ typography: "titleLg" }}>{row.roleName}</Typography>
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
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
              {labels.ttlSecondsColumn}: {row.ttlSeconds}
            </Typography>
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
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
      <MobileSectionPanel title={labels.title} subTitle={labels.subtitle} />

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
          <SessionConfigDialogsShared
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
          <MobileFab icon={<AddOutlined />} label={labels.addLabel} onClick={onAdd} />
        </>
      ) : null}
    </Box>
  );
}
