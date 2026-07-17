"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PaginationControls } from "@/frontend/common/components/ui";
import type { AdminComplaintRow } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { ComplaintQueueCardDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintQueueCard.desktop";
import type { ComplaintsAdminLabels } from "@/shared/locale";

const StyledEmptyStateMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  textAlign: "center",
}));

const StyledQueueCardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface ComplaintQueueCardListDesktopProps {
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

export function ComplaintQueueCardListDesktop({
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
}: Readonly<ComplaintQueueCardListDesktopProps>) {
  if (rows.length === 0) {
    return <StyledEmptyStateMessage variant="bodyMd">{labels.queue.noEntries}</StyledEmptyStateMessage>;
  }

  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <Box>
      <StyledQueueCardContainer>
        {rows.map(row => (
          <ComplaintQueueCardDesktop
            key={row.id}
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
        ))}
      </StyledQueueCardContainer>
      {pageCount > 1 && (
        <PaginationControls
          page={page}
          pageCount={pageCount}
          rowCount={totalCount}
          pageSize={pageSize}
          embedded
          onPageChange={onPageChange}
        />
      )}
    </Box>
  );
}
