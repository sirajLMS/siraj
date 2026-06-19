"use client";

import { ChevronLeft, ChevronRight, SearchOutlined } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { SectionPanel } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ScheduleOverviewData } from "@/frontend/views/dashboard/types/dashboard";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleOverviewCardList } from "./ScheduleOverviewCardList";
import { ScheduleOverviewDataGrid } from "./ScheduleOverviewDataGrid";

export interface ScheduleOverviewSectionProps extends ScheduleOverviewData {
  readonly title: string;
  readonly loadingTeachers?: boolean;
  readonly teacherSearchValue?: string;
  readonly onTeacherSearchChange?: (search: string) => void;
}

const SectionFooter = ({ showingText }: { showingText: string }) => {
  return (
    <Box
      sx={theme => ({
        px: 3,
        py: 1.5,
        display: "flex",
        justifyContent: "flex-end",
        borderTop: `1px solid ${theme.palette.border.light}`,
      })}
    >
      <Typography
        sx={theme => ({
          fontFamily: '"Inter", sans-serif',
          fontSize: "12px",
          color: theme.palette.onSurfaceVariant,
        })}
      >
        {showingText}
      </Typography>
    </Box>
  );
};

export function ScheduleOverviewSection({
  title,
  searchPlaceholder,
  searchValue,
  dateLabel,
  dateValue,
  teacherPlaceholder,
  teacherValue,
  submitLabel,
  teachers,
  loadingTeachers,
  teacherSearchValue,
  onTeacherSearchChange,
  rows,
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
  showingText,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onSearchChange,
  onDateChange,
  onTeacherChange,
  onSubmit,
}: ScheduleOverviewSectionProps) {
  return (
    <>
      {/* Desktop Layout */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Paper
          elevation={0}
          sx={theme => ({
            borderRadius: 3,
            border: `1px solid ${theme.palette.border.light}`,
            overflow: "hidden",
          })}
        >
          <SectionPanel
            title={title}
            actions={
              <RequirePermission permissions={[AppPermission.DashboardSearch]}>
                <TextField
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={e => {
                    onSearchChange(e.target.value);
                  }}
                  size="small"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlined sx={theme => ({ fontSize: 18, color: theme.palette.onSurfaceVariant })} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    maxWidth: { md: 280 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </RequirePermission>
            }
          >
            {/* Filters */}
            <RequirePermission permissions={[AppPermission.ScheduleFilterAdvanced]}>
              <Box
                sx={theme => ({
                  px: 3,
                  py: 2.5,
                  bgcolor: theme.palette.background.default,
                  borderBottom: `1px solid ${theme.palette.border.light}`,
                })}
              >
                <ScheduleFilters
                  dateLabel={dateLabel}
                  dateValue={dateValue}
                  teacherPlaceholder={teacherPlaceholder}
                  teacherValue={teacherValue}
                  submitLabel={submitLabel}
                  teachers={teachers}
                  loadingTeachers={loadingTeachers}
                  teacherSearchValue={teacherSearchValue}
                  onTeacherSearchChange={onTeacherSearchChange}
                  onDateChange={onDateChange}
                  onTeacherChange={onTeacherChange}
                  onSubmit={onSubmit}
                />
              </Box>
            </RequirePermission>

            {/* Table */}
            <ScheduleOverviewDataGrid
              rows={rows}
              headers={headers}
              statusLabels={statusLabels}
              detailsLabel={detailsLabel}
              emptyMessage={emptyMessage}
            />

            <SectionFooter showingText={showingText} />
          </SectionPanel>
        </Paper>
      </Box>

      {/* Mobile Layout */}
      <Box sx={{ display: { xs: "block", md: "none" }, mb: 3 }}>
        {/* Title */}
        <Typography
          variant="titleLg"
          sx={theme => ({
            color: theme.palette.primary.main,
            mb: 2,
          })}
        >
          {title}
        </Typography>

        {/* Search */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
          <RequirePermission permissions={[AppPermission.DashboardSearch]}>
            <TextField
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => {
                onSearchChange(e.target.value);
              }}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={theme => ({ fontSize: 18, color: theme.palette.onSurfaceVariant })} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: theme => theme.palette.surfaceContainerLowest,
                },
              }}
            />
          </RequirePermission>
        </Box>

        {/* Card List */}
        <ScheduleOverviewCardList
          rows={rows}
          statusLabels={statusLabels}
          detailsLabel={detailsLabel}
          emptyMessage={emptyMessage}
        />

        {/* Pagination Footer */}
        {totalCount > pageSize && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 2,
              px: 1,
            }}
          >
            <Typography
              variant="labelMd"
              sx={theme => ({
                color: theme.palette.text.secondary,
              })}
            >
              {showingText}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                size="small"
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
                sx={theme => ({
                  border: `1px solid ${theme.palette.border.light}`,
                  borderRadius: 1,
                  bgcolor: theme.palette.surfaceContainerLowest,
                  "&.Mui-disabled": {
                    opacity: 0.5,
                  },
                })}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                disabled={page >= Math.ceil(totalCount / pageSize) - 1}
                onClick={() => onPageChange(page + 1)}
                sx={theme => ({
                  border: `1px solid ${theme.palette.border.light}`,
                  borderRadius: 1,
                  bgcolor: theme.palette.surfaceContainerLowest,
                  "&.Mui-disabled": {
                    opacity: 0.5,
                  },
                })}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
}
