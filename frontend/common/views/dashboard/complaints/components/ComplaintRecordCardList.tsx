"use client";

import { ExpandMoreOutlined, HistoryOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PaginationControls } from "@/frontend/common/components/ui";
import { ComplaintRecordCard } from "@/frontend/common/views/dashboard/complaints/components/ComplaintRecordCard";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsParentLabels } from "@/shared/locale";

/** Header row with icon/title on the left and count chip on the right */
const StyledCardListHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(3),
  gap: theme.spacing(2),
}));

/** History icon in primary color for the section header */
const StyledHistoryIcon = styled(HistoryOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

/** Group containing the history icon and section title */
const StyledCardListTitleGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

/** Chip displaying the total record count with surface-container background */
const StyledTotalCountChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.surfaceContainerHigh,
}));

/** Vertical container for the list of complaint record cards */
const StyledCardListContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

/** Centered container for the "load older" button */
const StyledLoadMoreContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  marginTop: theme.spacing(4),
}));

/** Uppercase styled "load older records" button */
const StyledLoadMoreButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
}));

interface ComplaintRecordCardListProps {
  readonly records: readonly ParentComplaintRecord[];
  readonly labels: ComplaintsParentLabels;
  readonly hasOlderRecords: boolean;
  readonly onLoadOlderRecords: () => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export function ComplaintRecordCardList({
  records,
  labels,
  hasOlderRecords,
  onLoadOlderRecords,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<ComplaintRecordCardListProps>) {
  const totalLabel = labels.totalRecords(totalCount ?? records.length);
  const showPagination = totalCount !== undefined && onPageChange !== undefined && totalCount > 0;
  const pageCount = pageSize > 0 ? Math.ceil((totalCount ?? 0) / pageSize) : 0;

  return (
    <Box>
      {/* Section header with icon, title, and record count */}
      <StyledCardListHeader>
        <StyledCardListTitleGroup>
          <StyledHistoryIcon />
          <Typography variant="titleLg">{labels.recordTitle}</Typography>
        </StyledCardListTitleGroup>
        <StyledTotalCountChip label={totalLabel} size="small" />
      </StyledCardListHeader>

      {/* List of complaint record cards */}
      <StyledCardListContainer>
        {records.map(record => (
          <ComplaintRecordCard key={record.id} record={record} labels={labels} />
        ))}
      </StyledCardListContainer>

      {showPagination ? (
        <PaginationControls
          page={page}
          pageCount={pageCount}
          rowCount={totalCount}
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
