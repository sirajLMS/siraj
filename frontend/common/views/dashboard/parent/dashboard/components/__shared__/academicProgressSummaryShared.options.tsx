import { Box, Stack } from "@mui/material";
import type { AcademicProgressSummarySharedOptions } from "@/frontend/common/views/dashboard/parent/dashboard/components/__shared__/academicProgressSummaryShared";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";

export const DESKTOP_OPTIONS: AcademicProgressSummarySharedOptions = {
  titleVariant: "headlineMd",
  analyticsIconSize: 32,
  paperSx: theme => ({
    p: 3,
    borderRadius: 3,
    backgroundColor: theme.palette.surfaceContainerLowest,
    border: `1px solid ${theme.palette.outlineVariant}`,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  }),
  headerMb: 3,
  buttonSx: theme => ({
    py: 1.5,
    borderColor: theme.palette.outlineVariant,
    color: theme.palette.primary.main,
    fontWeight: 700,
    letterSpacing: "0.1em",
    "&:hover": {
      backgroundColor: theme.palette.header,
      color: theme.palette.onPrimary,
      borderColor: theme.palette.header,
    },
  }),
  renderProgressRows: (studentProgress, renderRow) => (
    <Stack spacing={3} sx={{ mb: 3 }}>
      {studentProgress.map(student => renderRow(student))}
    </Stack>
  ),
  rowOptions: {
    wrapperSx: {} as const,
    nameContainerSx: { display: "flex", justifyContent: "space-between", mb: 1 } as const,
    linearProgressHeight: 8,
  },
};

export const MOBILE_OPTIONS: AcademicProgressSummarySharedOptions = {
  titleVariant: "titleLg",
  analyticsIconSize: 24,
  paperSx: theme => ({
    p: 2,
    borderRadius: 2,
    backgroundColor: theme.palette.surfaceContainerLowest,
    border: `1px solid ${theme.palette.outlineVariant}`,
    display: "flex",
    flexDirection: "column",
  }),
  headerMb: 2,
  buttonSx: theme => ({
    py: 1,
    borderColor: theme.palette.outlineVariant,
    color: theme.palette.primary.main,
    fontWeight: 700,
    letterSpacing: "0.08em",
    "&:hover": {
      backgroundColor: theme.palette.header,
      color: theme.palette.onPrimary,
      borderColor: theme.palette.header,
    },
  }),
  renderProgressRows: (studentProgress, renderRow) => (
    <Box sx={{ mb: 2 }}>
      <MobileCardList
        rows={studentProgress}
        getKey={student => student.id}
        paginationOptions={false}
        layout="edge-to-edge"
        renderItem={student => <MobileCardListItem variant="edge-to-edge">{renderRow(student)}</MobileCardListItem>}
      />
    </Box>
  ),
  rowOptions: {
    wrapperSx: {} as const,
    nameContainerSx: { display: "flex", justifyContent: "space-between", mb: 0.75 } as const,
    linearProgressHeight: 6,
  },
};
