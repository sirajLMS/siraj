"use client";

import { AddOutlined, FilterListOutlined, PersonAddAltOutlined, SearchOutlined } from "@mui/icons-material";
import { Box, Fab, IconButton, InputAdornment, TextField } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { StudentDirectoryCardList } from "./components/StudentDirectoryCardList";
import { StudentMobileMetricsScroll } from "./components/StudentMobileMetricsScroll";
import type { StudentDirectoryCardListLabels, StudentDirectoryRowExtended } from "./types";

interface StudentsMobileViewProps {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly searchPlaceholder: string;
  readonly addStudentLabel: string;
  readonly filtersLabel: string;
  readonly searchQuery: string;
  readonly mobileMetrics: readonly MetricItem[];
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly loading?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly cardListLabels: StudentDirectoryCardListLabels;
  readonly onSearchChange: (query: string) => void;
  readonly onAddStudent: () => void;
  readonly onFilterClick: () => void;
  readonly onViewProfile: (id: string) => void;
}

export function StudentsMobileView({
  pageTitle,
  pageSubtitle,
  searchPlaceholder,
  addStudentLabel,
  filtersLabel,
  searchQuery,
  mobileMetrics,
  rows,
  loading,
  page,
  pageSize,
  totalCount,
  onPageChange,
  cardListLabels,
  onSearchChange,
  onAddStudent,
  onFilterClick,
  onViewProfile,
}: StudentsMobileViewProps) {
  return (
    <PageContainer>
      <Box sx={{ pb: 10 }}>
        <PageHeader title={pageTitle} subtitle={pageSubtitle} titleVariant="headlineMd" />

        <StudentMobileMetricsScroll metrics={mobileMetrics} />

        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={e => {
              onSearchChange(e.target.value);
            }}
            placeholder={searchPlaceholder}
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
            aria-label={filtersLabel}
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
              aria-label={addStudentLabel}
              onClick={onAddStudent}
              sx={theme => ({
                backgroundColor: theme.palette.header,
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

        <StudentDirectoryCardList
          rows={rows}
          labels={cardListLabels}
          onViewProfile={onViewProfile}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          loading={loading}
        />

        <RequirePermission permissions={[AppPermission.StudentsCreate]}>
          <Fab
            id="students-mobile-fab"
            aria-label={addStudentLabel}
            onClick={onAddStudent}
            sx={theme => ({
              position: "fixed",
              bottom: 88,
              right: 24,
              backgroundColor: theme.palette.header,
              color: theme.palette.onPrimary,
              "&:hover": { backgroundColor: theme.palette.primary.dark },
            })}
          >
            <AddOutlined />
          </Fab>
        </RequirePermission>
      </Box>
    </PageContainer>
  );
}
