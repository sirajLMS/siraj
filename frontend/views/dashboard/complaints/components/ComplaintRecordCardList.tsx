"use client";

import { ExpandMoreOutlined, HistoryOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ComplaintsParentLabels } from "@/shared/messages/types/dashboard/complaints/main";
import type { ParentComplaintRecord } from "../types/complaints.types";
import { ComplaintRecordCard } from "./ComplaintRecordCard";

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
}

export function ComplaintRecordCardList({
  records,
  labels,
  hasOlderRecords,
  onLoadOlderRecords,
}: Readonly<ComplaintRecordCardListProps>) {
  const totalLabel = labels.totalRecords.replace("{count}", String(records.length));

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

      {/* Load older records button (shown when more records exist) */}
      {hasOlderRecords ? (
        <StyledLoadMoreContainer>
          <StyledLoadMoreButton onClick={onLoadOlderRecords} endIcon={<ExpandMoreOutlined />}>
            {labels.loadOlder}
          </StyledLoadMoreButton>
        </StyledLoadMoreContainer>
      ) : null}
    </Box>
  );
}
