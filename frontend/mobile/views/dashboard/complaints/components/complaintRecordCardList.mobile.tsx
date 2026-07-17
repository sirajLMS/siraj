"use client";

import { ExpandMoreOutlined, HistoryOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PaginationControls } from "@/frontend/common/components/ui";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { ComplaintRecordCardMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintRecordCard.mobile";
import type { ComplaintsParentLabels } from "@/shared/locale";

const StyledCardListHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(2),
  gap: theme.spacing(1.5),
}));

const StyledHistoryIcon = styled(HistoryOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledCardListTitleGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledTotalCountChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.surfaceContainerHigh,
}));

const StyledCardListContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledLoadMoreContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  marginTop: theme.spacing(3),
}));

const StyledLoadMoreButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
}));

interface ComplaintRecordCardListMobileProps {
  readonly records: readonly ParentComplaintRecord[];
  readonly labels: ComplaintsParentLabels;
  readonly hasOlderRecords: boolean;
  readonly onLoadOlderRecords: () => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export function ComplaintRecordCardListMobile({
  records,
  labels,
  hasOlderRecords,
  onLoadOlderRecords,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<ComplaintRecordCardListMobileProps>) {
  const totalLabel = labels.totalRecords(totalCount ?? records.length);
  const showPagination = totalCount !== undefined && onPageChange !== undefined && totalCount > 0;
  const pageCount = pageSize > 0 ? Math.ceil((totalCount ?? 0) / pageSize) : 0;

  return (
    <Box>
      <StyledCardListHeader>
        <StyledCardListTitleGroup>
          <StyledHistoryIcon />
          <Typography variant="titleLg">{labels.recordTitle}</Typography>
        </StyledCardListTitleGroup>
        <StyledTotalCountChip label={totalLabel} size="small" />
      </StyledCardListHeader>

      <StyledCardListContainer>
        {records.map(record => (
          <ComplaintRecordCardMobile key={record.id} record={record} labels={labels} />
        ))}
      </StyledCardListContainer>

      {showPagination ? (
        <PaginationControls
          page={page}
          pageCount={pageCount}
          rowCount={totalCount ?? 0}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      ) : (
        hasOlderRecords && (
          <StyledLoadMoreContainer>
            <StyledLoadMoreButton onClick={onLoadOlderRecords} endIcon={<ExpandMoreOutlined />}>
              {labels.loadOlder}
            </StyledLoadMoreButton>
          </StyledLoadMoreContainer>
        )
      )}
    </Box>
  );
}
