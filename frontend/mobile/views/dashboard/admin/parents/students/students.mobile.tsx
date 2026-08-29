"use client";

import { AddOutlined, FilterListOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import type { StudentsViewModel } from "@/frontend/common/views/dashboard/admin/parents/students/useStudentsViewModel";
import {
  MobileCardList,
  MobileContentInset,
  MobileContentStack,
  MobileFab,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { StudentDirectoryMobileCard } from "@/frontend/mobile/views/dashboard/admin/parents/students/components/studentDirectoryCard.mobile";

export function StudentsMobileView({
  labelsBySection,
  metrics,
  rows,
  totalStudents,
  searchQuery,
  page,
  pageSize,
  loading,
  onSearchChange,
  onAddStudent,
  onFilterClick,
  onViewProfile,
  onPageChange,
  canStudentsCreate,
}: Readonly<StudentsViewModel>) {
  const { shell, filters, actions, cards } = labelsBySection;

  const renderItem = (row: (typeof rows)[number]): ReactNode => (
    <StudentDirectoryMobileCard row={row} labels={cards} onViewProfile={onViewProfile} />
  );

  return (
    <MobilePageContainer>
      <MobilePageHeader title={shell.pageTitle} subtitle={shell.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={3} paddingBottom={10}>
        <MobileMetricCardGrid metrics={metrics} />

        <MobileContentInset sx={{ display: "flex", gap: 1, mb: 1 }}>
          <SearchBarField value={searchQuery} placeholder={filters.searchPlaceholder} onChange={onSearchChange} />
          <IconButton
            id="students-filter-mobile-btn"
            aria-label={filters.filters}
            onClick={onFilterClick}
            sx={theme => ({
              backgroundColor: theme.palette.surfaceContainerHigh,
              color: theme.palette.primary.main,
              borderRadius: 3,
              px: 2,
              "&:hover": { backgroundColor: theme.palette.surfaceContainerHighest },
            })}
          >
            <FilterListOutlined />
          </IconButton>
        </MobileContentInset>

        <MobileCardList<(typeof rows)[number]>
          rows={rows}
          renderItem={renderItem}
          getKey={row => row.id ?? ""}
          loading={loading}
          emptyMessage={shell.noEntries}
          gap={2}
          layout="edge-to-edge"
          paginationOptions={
            totalStudents === undefined
              ? { mode: "client" }
              : buildServerPaginationOptions({
                  page,
                  pageSize,
                  totalCount: totalStudents,
                  onPageChange,
                })
          }
        />

        {canStudentsCreate ? (
          <MobileFab icon={<AddOutlined />} label={actions.addStudent} onClick={onAddStudent} />
        ) : null}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
