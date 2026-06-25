"use client";

import { ChevronLeft, ChevronRight, SearchOutlined } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { SectionPanel } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ScheduleOverviewData } from "@/frontend/views/dashboard/types/dashboard";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleOverviewCardList } from "./ScheduleOverviewCardList";
import { ScheduleOverviewDataGrid } from "./ScheduleOverviewDataGrid";

// Desktop panel wrapper with rounded border and hidden overflow
const StyledDesktopPanel = styled(Paper)(({ theme }) => ({
  borderRadius: Number(theme.shape.borderRadius) * 2,
  border: `1px solid ${theme.palette.border.light}`,
  overflow: "hidden",
}));

// Container for the date and teacher filters inside the desktop layout
const StyledFilterContainer = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(2.5),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.border.light}`,
}));

// Search icon styled consistently for both desktop and mobile search fields
const StyledSearchIcon = styled(SearchOutlined)(({ theme }) => ({
  fontSize: 18,
  color: theme.palette.onSurfaceVariant,
}));

// Mobile section title displayed in primary color
const StyledMobileSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Pagination bar at bottom of mobile layout showing count and nav buttons
const StyledPaginationFooter = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingInline: theme.spacing(1),
}));

// Page count label in the mobile pagination footer
const StyledPageCountLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Bordered navigation button for mobile pagination with disabled state
const StyledPageNavButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.palette.border.light}`,
  borderRadius: Number(theme.shape.borderRadius),
  backgroundColor: theme.palette.surfaceContainerLowest,
  "&.Mui-disabled": {
    opacity: 0.5,
  },
}));

export interface ScheduleOverviewSectionProps extends ScheduleOverviewData {
  readonly title: string;
}

// Desktop Layout Component - shows data grid with filters and search
const DesktopLayout = ({
  title,
  searchPlaceholder,
  searchValue,
  rows,
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onSearchChange,
  dateLabel,
  dateValue,
  teacherPlaceholder,
  teacherValue,
  submitLabel,
  teachers,
  onDateChange,
  onTeacherChange,
  onSubmit,
}: ScheduleOverviewSectionProps) => (
  <Box sx={{ display: { xs: "none", md: "block" } }}>
    <StyledDesktopPanel elevation={0}>
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
                      <StyledSearchIcon />
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
        {/* Filters - date picker and teacher autocomplete */}
        <RequirePermission permissions={[AppPermission.ScheduleFilterAdvanced]}>
          <StyledFilterContainer>
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
          </StyledFilterContainer>
        </RequirePermission>

        {/* Desktop data grid table */}
        <ScheduleOverviewDataGrid
          rows={rows}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          headers={headers}
          statusLabels={statusLabels}
          detailsLabel={detailsLabel}
          emptyMessage={emptyMessage}
        />
      </SectionPanel>
    </StyledDesktopPanel>
  </Box>
);

// Mobile Layout Component - shows card list with search and pagination
const MobileLayout = ({
  title,
  searchPlaceholder,
  searchValue,
  rows,
  statusLabels,
  detailsLabel,
  emptyMessage,
  showingText,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onSearchChange,
}: ScheduleOverviewSectionProps) => (
  <Stack
    direction={"column"}
    sx={{
      display: { xs: "flex", md: "none" },
      gap: 2,
    }}
  >
    {/* Mobile section title */}
    <StyledMobileSectionTitle variant="titleLg">{title}</StyledMobileSectionTitle>

    {/* Mobile search field */}
    <Box sx={{ display: "flex", gap: 1.5 }}>
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
                  <StyledSearchIcon />
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

    {/* Mobile card list of schedule items */}
    <ScheduleOverviewCardList
      rows={rows}
      statusLabels={statusLabels}
      detailsLabel={detailsLabel}
      emptyMessage={emptyMessage}
    />

    {/* Mobile pagination footer with count and nav buttons */}
    <StyledPaginationFooter>
      <StyledPageCountLabel variant="labelMd">{showingText}</StyledPageCountLabel>
      <Box sx={{ display: "flex", gap: 1 }}>
        <StyledPageNavButton size="small" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft fontSize="small" />
        </StyledPageNavButton>
        <StyledPageNavButton
          size="small"
          disabled={page >= Math.ceil(totalCount / pageSize) - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight fontSize="small" />
        </StyledPageNavButton>
      </Box>
    </StyledPaginationFooter>
  </Stack>
);

// Schedule Overview Section - renders desktop data grid or mobile card list
// depending on viewport width, with shared filters and search
export function ScheduleOverviewSection(props: ScheduleOverviewSectionProps) {
  return (
    <>
      {/* Desktop: data grid with filters, search, and footer */}
      <DesktopLayout {...props} />
      {/* Mobile: card list with search and pagination */}
      <MobileLayout {...props} />
    </>
  );
}
