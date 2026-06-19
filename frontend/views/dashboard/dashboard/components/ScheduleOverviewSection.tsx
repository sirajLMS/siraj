"use client";

import { CalendarMonthOutlined, SearchOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, InputAdornment, Paper, TextField, Typography } from "@mui/material";
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
  readonly viewAllLabel?: string;
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
  viewAllLabel,
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
        {/* Title + View All */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography
            variant="titleLg"
            sx={theme => ({
              color: theme.palette.primary.main,
            })}
          >
            {title}
          </Typography>
          {viewAllLabel && (
            <Button
              variant="text"
              size="small"
              sx={theme => ({
                color: theme.palette.primary.main,
                typography: "labelUppercase",
                textTransform: "none",
                gap: 0.5,
              })}
            >
              {viewAllLabel}
            </Button>
          )}
        </Box>

        {/* Search + Calendar */}
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
          <RequirePermission permissions={[AppPermission.ScheduleFilterAdvanced]}>
            <IconButton
              onClick={() => {
                // Open date picker or trigger filter
              }}
              sx={theme => ({
                width: 40,
                height: 40,
                borderRadius: 2,
                border: `1px solid ${theme.palette.border.light}`,
                bgcolor: theme.palette.surfaceContainerLowest,
                color: theme.palette.primary.main,
              })}
            >
              <CalendarMonthOutlined />
            </IconButton>
          </RequirePermission>
        </Box>

        {/* Card List */}
        <ScheduleOverviewCardList
          rows={rows}
          statusLabels={statusLabels}
          detailsLabel={detailsLabel}
          emptyMessage={emptyMessage}
        />
      </Box>
    </>
  );
}
