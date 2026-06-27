"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PaginationControls } from "@/frontend/components/ui/PaginationControls";
import type { ComplaintsAdminLabels } from "@/shared/messages/types/dashboard/complaints/main";
import type { AdminComplaintRow } from "../types/complaints.types";
import { ComplaintQueueCard } from "./ComplaintQueueCard";

/** Centered message displayed when the complaint queue has no entries */
const StyledEmptyStateMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  textAlign: "center",
}));

/** Vertical container for the list of complaint queue cards */
const StyledQueueCardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface ComplaintQueueCardListProps {
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

export function ComplaintQueueCardList({
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
}: Readonly<ComplaintQueueCardListProps>) {
  if (rows.length === 0) {
    return <StyledEmptyStateMessage variant="bodyMd">{labels.queue.noEntries}</StyledEmptyStateMessage>;
  }

  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <Box>
      <StyledQueueCardContainer>
        {rows.map(row => (
          <ComplaintQueueCard
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
