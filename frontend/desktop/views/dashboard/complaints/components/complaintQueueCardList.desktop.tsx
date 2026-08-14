"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  buildQueueCardProps,
  type ComplaintQueueCardListSharedProps,
} from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintQueueCardListShared";
import { DesktopPaginationControls } from "@/frontend/desktop/components/ui/filter";
import { ComplaintQueueCardDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintQueueCard.desktop";

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
}: Readonly<ComplaintQueueCardListSharedProps>) {
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
            {...buildQueueCardProps(
              row,
              labels,
              draftResponses,
              canManage,
              canDelete,
              onDraftChange,
              onAnswer,
              onDelete
            )}
          />
        ))}
      </StyledQueueCardContainer>
      {pageCount > 1 && (
        <DesktopPaginationControls
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
