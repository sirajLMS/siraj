"use client";

import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { AdminComplaintRow } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { MobileCardList } from "@/frontend/mobile/components/ui";
import { ComplaintQueueCardMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintQueueCard.mobile";
import type { ComplaintsAdminLabels } from "@/shared/locale";

const StyledEmptyStateMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  textAlign: "center",
}));

interface ComplaintQueueCardListMobileProps {
  readonly rows: readonly AdminComplaintRow[];
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onDraftChange: (id: string, text: string) => void;
  readonly onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: (id: string) => void;
  readonly onPageChange: (page: number) => void;
}

export function ComplaintQueueCardListMobile({
  rows,
  labels,
  draftResponses,
  canManage,
  canDelete,
  page,
  pageSize,
  totalCount,
  onDraftChange,
  onAnswer,
  onDelete,
  onPageChange,
}: Readonly<ComplaintQueueCardListMobileProps>) {
  if (rows.length === 0) {
    return <StyledEmptyStateMessage variant="bodyMd">{labels.queue.noEntries}</StyledEmptyStateMessage>;
  }

  return (
    <MobileCardList
      rows={rows}
      getKey={row => row.id}
      layout="rounded"
      gap={2}
      paginationOptions={buildServerPaginationOptions({
        page,
        pageSize,
        totalCount,
        onPageChange,
      })}
      renderItem={row => (
        <ComplaintQueueCardMobile
          row={row}
          labels={labels}
          draftResponse={draftResponses[row.id] ?? ""}
          canManage={canManage}
          canDelete={canDelete}
          onDraftChange={text => {
            onDraftChange(row.id, text);
          }}
          onAnswer={options => {
            onAnswer(row.id, options);
          }}
          onDelete={() => {
            onDelete(row.id);
          }}
        />
      )}
    />
  );
}
