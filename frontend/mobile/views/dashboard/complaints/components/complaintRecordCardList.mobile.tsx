"use client";

import { ExpandMoreOutlined, HistoryOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { MobileListPagination } from "@/frontend/mobile/components/ui/filter";
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
  readonly paginationOptions: ListPaginationOptions;
}

export function ComplaintRecordCardListMobile({
  records,
  labels,
  hasOlderRecords,
  onLoadOlderRecords,
  paginationOptions,
}: Readonly<ComplaintRecordCardListMobileProps>) {
  const totalLabel = labels.totalRecords(
    paginationOptions !== false && paginationOptions.mode === "server"
      ? paginationOptions.totalCount
      : records.length,
  );
  const showPagination = paginationOptions !== false && paginationOptions.mode === "server";

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
        <MobileListPagination paginationOptions={paginationOptions} />
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
