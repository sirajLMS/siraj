"use client";

import { AddOutlined, PersonAddAltOutlined, SearchOutlined } from "@mui/icons-material";
import { Box, Fab, IconButton, InputAdornment, TextField } from "@mui/material";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { StudentDirectoryCardList } from "./components/StudentDirectoryCardList";
import { StudentMobileMetricsScroll } from "./components/StudentMobileMetricsScroll";
import type { StudentAccountStatus, StudentDirectoryRowExtended, StudentEnrollmentStatus } from "./types";

interface StudentsMobileViewProps {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly searchPlaceholder: string;
  readonly addStudentLabel: string;
  readonly searchQuery: string;
  readonly mobileMetrics: readonly MetricItem[];
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly cardListLabels: {
    readonly weeklyHours: string;
    readonly enrollmentStatus: string;
    readonly classesLeft: string;
    readonly viewProfile: string;
    readonly statusLabels: Record<StudentAccountStatus, string>;
    readonly enrollmentLabels: Record<StudentEnrollmentStatus, string>;
  };
  readonly onSearchChange: (query: string) => void;
  readonly onAddStudent: () => void;
  readonly onViewProfile: (id: string) => void;
}

export function StudentsMobileView({
  pageTitle,
  pageSubtitle,
  searchPlaceholder,
  addStudentLabel,
  searchQuery,
  mobileMetrics,
  rows,
  cardListLabels,
  onSearchChange,
  onAddStudent,
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
                  bgcolor: theme.palette.background.paper,
                  py: 0.5,
                }),
              },
            }}
          />
          <IconButton
            id="students-add-mobile-btn"
            aria-label={addStudentLabel}
            onClick={onAddStudent}
            sx={theme => ({
              bgcolor: theme.palette.header,
              color: theme.palette.onPrimary,
              borderRadius: 3,
              px: 2,
              "&:hover": { bgcolor: theme.palette.primary.dark },
            })}
          >
            <PersonAddAltOutlined />
          </IconButton>
        </Box>

        <StudentDirectoryCardList rows={rows} labels={cardListLabels} onViewProfile={onViewProfile} />

        <Fab
          id="students-mobile-fab"
          aria-label={addStudentLabel}
          onClick={onAddStudent}
          sx={theme => ({
            position: "fixed",
            bottom: 88,
            right: 24,
            bgcolor: theme.palette.header,
            color: theme.palette.onPrimary,
            "&:hover": { bgcolor: theme.palette.primary.dark },
          })}
        >
          <AddOutlined />
        </Fab>
      </Box>
    </PageContainer>
  );
}
