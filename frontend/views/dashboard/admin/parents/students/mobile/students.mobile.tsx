"use client";

import { AddOutlined, FilterListOutlined, PersonAddAltOutlined, SearchOutlined } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import type { ReactNode } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import {
  MobileCardList,
  MobileContentStack,
  MobileFab,
  MobilePageHeader,
  PageContainer,
} from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StudentMobileMetricsScroll } from "@/frontend/views/dashboard/admin/parents/students/components/StudentMobileMetricsScroll";
import { StudentDirectoryMobileCard } from "@/frontend/views/dashboard/admin/parents/students/mobile/components/studentDirectoryCard.mobile";
import type { StudentsViewModel } from "@/frontend/views/dashboard/admin/parents/students/useStudentsViewModel";

export function StudentsMobileView({
  labels,
  mobileMetrics,
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

  const pageCount = totalStudents !== undefined && pageSize > 0 ? Math.ceil(totalStudents / pageSize) : 0;

  return (
    <PageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={3} paddingBottom={10}>
        <StudentMobileMetricsScroll metrics={mobileMetrics} />

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
          <RequirePermission permissions={[AppPermission.StudentsCreate]}>
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
          </RequirePermission>
        </Box>

        <MobileCardList<(typeof rows)[number]>
          rows={rows}
          renderItem={renderItem}
          getKey={row => row.id ?? ""}
          loading={loading}
          emptyMessage={labels.noEntries}
          gap={2}
          layout="rounded"
          pagination={
            totalStudents !== undefined
              ? { page, pageCount, rowCount: totalStudents, pageSize, onPageChange }
              : undefined
          }
        />

        <RequirePermission permissions={[AppPermission.StudentsCreate]}>
          <MobileFab icon={<AddOutlined />} label={labels.addStudent} onClick={onAddStudent} />
        </RequirePermission>
      </MobileContentStack>
    </PageContainer>
  );
}
