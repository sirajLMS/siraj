export interface StudentDashboardState {
  readonly reflectionDialogOpen: boolean;
  readonly selectedReportId: string | null;
  setReflectionDialogOpen: (open: boolean) => void;
  setSelectedReportId: (reportId: string | null) => void;
}
