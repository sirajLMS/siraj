"use client";

import { AddOutlined, FilterListOutlined, PersonAddAltOutlined, SearchOutlined } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { StudentsViewModel } from "@/frontend/common/views/dashboard/admin/parents/students/useStudentsViewModel";
import {
  MobileCardList,
  MobileContentStack,
  MobileFab,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { StudentDirectoryMobileCard } from "@/frontend/mobile/views/dashboard/admin/parents/students/components/studentDirectoryCard.mobile";

export function StudentsMobileView({
  labels,
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
  // NEW FOR PLAN v5: lifted permission boolean consumed by the tier view
  // instead of a `RequirePermission` wrapper.
  canStudentsCreate,
}: Readonly<StudentsViewModel>) {
  const cardListLabels = {
    weeklyHours: labels.weeklyHours,
    enrollmentStatus: labels.enrollmentStatus,
    classesLeft: labels.classesLeft,
    viewProfile: labels.viewProfile,
    statusLabels: labels.statusLabels,
    enrollmentLabels: labels.enrollmentLabels,
  };

  const renderItem = (row: (typeof rows)[number]): ReactNode => (
    <StudentDirectoryMobileCard row={row} labels={cardListLabels} onViewProfile={onViewProfile} />
  );

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={3} paddingBottom={10}>
        <MobileMetricCardGrid metrics={metrics} />

        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={e => {
              onSearchChange(e.target.value);
            }}
            placeholder={labels.searchPlaceholder}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={theme => ({ fontSize: 20, color: theme.palette.text.secondary })} />
                  </InputAdornment>
                ),
                sx: theme => ({
                  borderRadius: 3,
                  backgroundColor: theme.palette.background.paper,
                  py: 0.5,
                }),
              },
            }}
          />
          <IconButton
            id="students-filter-mobile-btn"
            aria-label={labels.filters}
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
          {canStudentsCreate ? (
            <IconButton
              id="students-add-mobile-btn"
              aria-label={labels.addStudent}
              onClick={onAddStudent}
              sx={theme => ({
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                borderRadius: 3,
                px: 2,
                "&:hover": { backgroundColor: theme.palette.primary.dark },
              })}
            >
              <PersonAddAltOutlined />
            </IconButton>
          ) : null}
        </Box>

        <MobileCardList<(typeof rows)[number]>
          rows={rows}
          renderItem={renderItem}
          getKey={row => row.id ?? ""}
          loading={loading}
          emptyMessage={labels.noEntries}
          gap={2}
          layout="rounded"
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
          <MobileFab icon={<AddOutlined />} label={labels.addStudent} onClick={onAddStudent} />
        ) : null}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
