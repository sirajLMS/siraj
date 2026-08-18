"use client";

import { styled } from "@mui/material/styles";
import { PaginationControls } from "@/frontend/common/components/ui/filter/PaginationControls";
import type { SearchSchedulePaginationFooterProps } from "@/frontend/common/views/dashboard/search-schedule/types";

const StyledFooter = styled("footer")(({ theme }) => ({
  position: "sticky",
  bottom: 0,
  marginTop: "auto",
  flexShrink: 0,
  borderTop: `1px solid ${theme.palette.border.light}`,
  backgroundColor: theme.palette.background.default,
  boxShadow: theme.palette.shadow.card,
}));

export function SearchSchedulePaginationFooterDesktop({
  pageInfo,
  teacherCount,
  onPageChange,
}: Readonly<SearchSchedulePaginationFooterProps>) {
  const total = pageInfo.total ?? 0;
  if (total <= 0) {
    return null;
  }

  return (
    <StyledFooter>
      <PaginationControls
        page={(pageInfo.currentPage ?? 1) - 1}
        pageCount={pageInfo.lastPage ?? 1}
        rowCount={total}
        pageSize={pageInfo.perPage ?? teacherCount}
        onPageChange={onPageChange}
      />
    </StyledFooter>
  );
}
