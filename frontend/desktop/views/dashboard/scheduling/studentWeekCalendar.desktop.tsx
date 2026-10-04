"use client";

import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState } from "react";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import {
  addDays,
  useStudentWeekCalendarViewModel,
} from "@/frontend/common/views/dashboard/scheduling/student-week-calendar/useStudentWeekCalendarViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { WeekGrid } from "@/frontend/desktop/views/dashboard/scheduling/studentWeekCalendarGrid.parts";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

const MONTH_DAY_OPTIONS: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
const MONTH_DAY_YEAR_OPTIONS: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };

function formatWeekRange(weekStart: Date, locale: string): string {
  const start = getDateTimeFormatter(getLatnLocaleTag(locale), MONTH_DAY_OPTIONS).format(weekStart);
  const end = getDateTimeFormatter(getLatnLocaleTag(locale), MONTH_DAY_YEAR_OPTIONS).format(addDays(weekStart, 6));
  return `${start} — ${end}`;
}

export function StudentWeekCalendarContainer() {
  const [studentId] = useState("741f9933-8c5f-4507-acb8-fca09adcbe58");
  const { labels, locale, weekStart, goToPreviousWeek, goToNextWeek, goToToday, classes, loading, error } =
    useStudentWeekCalendarViewModel(studentId);

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} />
      <Stack direction="row" sx={{ alignItems: "center", mb: 2, gap: 1 }}>
        <IconButton onClick={goToPreviousWeek} aria-label={labels.previousWeek}>
          <ChevronLeftOutlined />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {formatWeekRange(weekStart, locale)}
        </Typography>
        <IconButton onClick={goToNextWeek} aria-label={labels.nextWeek}>
          <ChevronRightOutlined />
        </IconButton>
        <Button
          variant="outlined"
          size="small"
          onClick={goToToday}
          sx={theme => ({
            borderRadius: 2,
            textTransform: "none",
            ml: 1,
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            "&:hover": {
              borderColor: theme.palette.primary.dark,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          })}
        >
          {labels.today}
        </Button>
      </Stack>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {labels.failedToLoad}
        </Alert>
      ) : null}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card variant="outlined">
          <CardContent sx={{ p: 0 }}>
            <WeekGrid classes={classes} weekStart={weekStart} locale={locale} defaultSubject={labels.defaultSubject} />
          </CardContent>
        </Card>
      )}
    </DesktopPageContainer>
  );
}
