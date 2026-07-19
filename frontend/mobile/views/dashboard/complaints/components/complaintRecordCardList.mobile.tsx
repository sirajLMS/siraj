"use client";

import { ExpandMoreOutlined, HistoryOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
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
    paginationOptions !== false && paginationOptions.mode === "server" ? paginationOptions.totalCount : records.length
  );
  const showLoadMore = paginationOptions === false && hasOlderRecords;

  return (
    <Box>
      <StyledCardListHeader>
        <StyledCardListTitleGroup>
          <StyledHistoryIcon />
          <Typography variant="titleLg">{labels.recordTitle}</Typography>
        </StyledCardListTitleGroup>
        <StyledTotalCountChip label={totalLabel} size="small" />
      </StyledCardListHeader>

      <MobileCardList
        rows={records}
        getKey={record => record.id}
        paginationOptions={paginationOptions}
        layout="edge-to-edge"
        renderItem={record => (
          <MobileCardListItem variant="edge-to-edge">
            <ComplaintRecordCardMobile record={record} labels={labels} bare />
          </MobileCardListItem>
        )}
      />

      {showLoadMore ? (
        <StyledLoadMoreContainer>
          <StyledLoadMoreButton onClick={onLoadOlderRecords} endIcon={<ExpandMoreOutlined />}>
            {labels.loadOlder}
          </StyledLoadMoreButton>
        </StyledLoadMoreContainer>
      ) : null}
    </Box>
  );
}
