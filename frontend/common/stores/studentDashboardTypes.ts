export interface StudentDashboardState {
  readonly reflectionDialogOpen: boolean;
  readonly selectedReportId: string | null;
  readonly page: number;
  readonly pageSize: number;
  readonly reportsTotalCount: number;
  setReflectionDialogOpen: (open: boolean) => void;
  setSelectedReportId: (reportId: string | null) => void;
  setPage: (page: number) => void;
  setReportsTotalCount: (count: number) => void;
}
