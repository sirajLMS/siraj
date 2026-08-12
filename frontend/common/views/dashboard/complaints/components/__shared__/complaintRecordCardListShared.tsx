"use client";

import { ExpandMoreOutlined, HistoryOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { ComplaintsParentLabels } from "@/shared/locale";

export interface ComplaintRecordCardListSharedOptions {
  readonly headerMarginBottom: number;
  readonly headerGap: number;
  readonly loadMoreMarginTop: number;
}

export interface ComplaintRecordCardListSharedProps {
  readonly labels: ComplaintsParentLabels;
  readonly totalCount: number;
  readonly showLoadMore: boolean;
  readonly onLoadOlderRecords: () => void;
  readonly children: ReactNode;
  readonly options: ComplaintRecordCardListSharedOptions;
}

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

export function ComplaintRecordCardListShared({
  labels,
  totalCount,
  showLoadMore,
  onLoadOlderRecords,
  children,
  options,
}: Readonly<ComplaintRecordCardListSharedProps>) {
  const totalLabel = labels.totalRecords(totalCount);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: options.headerMarginBottom,
          gap: options.headerGap,
        }}
      >
        <StyledCardListTitleGroup>
          <StyledHistoryIcon />
          <Typography variant="titleLg">{labels.recordTitle}</Typography>
        </StyledCardListTitleGroup>
        <StyledTotalCountChip label={totalLabel} size="small" />
      </Box>

      {children}

      {showLoadMore ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: options.loadMoreMarginTop }}>
          <Button
            onClick={onLoadOlderRecords}
            endIcon={<ExpandMoreOutlined />}
            sx={{ color: "primary.main", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            {labels.loadOlder}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
