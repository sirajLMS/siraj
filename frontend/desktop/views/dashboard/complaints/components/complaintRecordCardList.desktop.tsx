"use client";

import { ExpandMoreOutlined, HistoryOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { DesktopPaginationControls } from "@/frontend/desktop/components/ui/filter";
import { ComplaintRecordCardDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintRecordCard.desktop";
import type { ComplaintsParentLabels } from "@/shared/locale";

const StyledCardListHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(3),
  gap: theme.spacing(2),
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
  marginTop: theme.spacing(4),
}));

const StyledLoadMoreButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
}));

interface ComplaintRecordCardListDesktopProps {
  readonly records: readonly ParentComplaintRecord[];
  readonly labels: ComplaintsParentLabels;
  readonly hasOlderRecords: boolean;
  readonly onLoadOlderRecords: () => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export function ComplaintRecordCardListDesktop({
  records,
  labels,
  hasOlderRecords,
  onLoadOlderRecords,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<ComplaintRecordCardListDesktopProps>) {
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
          <ComplaintRecordCardDesktop key={record.id} record={record} labels={labels} />
        ))}
      </StyledCardListContainer>

      {showPagination ? (
        <DesktopPaginationControls
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
