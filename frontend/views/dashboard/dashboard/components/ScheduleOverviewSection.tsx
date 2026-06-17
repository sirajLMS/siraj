"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { SectionPanel } from "@/frontend/components/ui";
import type { ScheduleOverviewData } from "@/frontend/views/dashboard/types/dashboard";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleOverviewDataGrid } from "./ScheduleOverviewDataGrid";

export interface ScheduleOverviewSectionProps extends ScheduleOverviewData {
  readonly title: string;
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
  rows,
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
  showingText,
  onSearchChange,
  onDateChange,
  onTeacherChange,
  onSubmit,
}: ScheduleOverviewSectionProps) {
  return (
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
        }
      >
        {/* Filters */}
        <RequirePermission permissions={["schedule.filter_advanced"]}>
          <Box sx={theme => ({ px: 3, py: 2.5, borderBottom: `1px solid ${theme.palette.border.light}` })}>
            <ScheduleFilters
              dateLabel={dateLabel}
              dateValue={dateValue}
              teacherPlaceholder={teacherPlaceholder}
              teacherValue={teacherValue}
              submitLabel={submitLabel}
              teachers={teachers}
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
  );
}
