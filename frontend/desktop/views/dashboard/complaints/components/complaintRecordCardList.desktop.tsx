"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ComplaintRecordCardListShared } from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintRecordCardListShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintRecordCardListShared.options";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { DesktopPaginationControls } from "@/frontend/desktop/components/ui/filter";
import { ComplaintRecordCardDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintRecordCard.desktop";
import type { ComplaintsParentLabels } from "@/shared/locale";

const StyledCardListContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
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
  const resolvedTotalCount = totalCount ?? records.length;
  const showPagination = totalCount !== undefined && onPageChange !== undefined && totalCount > 0;
  const pageCount = pageSize > 0 ? Math.ceil((totalCount ?? 0) / pageSize) : 0;

  return (
    <ComplaintRecordCardListShared
      labels={labels}
      totalCount={resolvedTotalCount}
      showLoadMore={!showPagination && hasOlderRecords}
      onLoadOlderRecords={onLoadOlderRecords}
      options={DESKTOP_OPTIONS}
    >
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
      ) : null}
    </ComplaintRecordCardListShared>
  );
}
