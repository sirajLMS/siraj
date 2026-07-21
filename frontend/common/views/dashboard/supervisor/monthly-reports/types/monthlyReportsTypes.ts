import type { SvgIconComponent } from "@mui/icons-material";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import type { SupervisorMonthlyReportsLabels } from "@/shared/locale";

export interface TeacherMonthlyReportData {
  readonly teacherId: string;
  readonly teacherName: string;
  readonly year: number;
  readonly month: number;
  readonly lessonsTaught: number;
  readonly approvedCount: number;
  readonly cancelledCount: number;
  readonly totalAccruedHours: string;
  readonly totalDueAmount: string;
  readonly totalPaidAmount: string;
  readonly currency: string;
}

export interface StudentMonthlyReportData {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly year: number;
  readonly month: number;
  readonly totalLessons: number;
  readonly completedLessons: number;
  readonly cancelledLessons: number;
  readonly presentCount: number;
  readonly absentCount: number;
  readonly lateCount: number;
  readonly totalHours: string;
  readonly creditsPurchased: string;
  readonly creditsDeducted: string;
  readonly creditsRefunded: string;
  readonly creditsBalance: string;
}

export interface MonthlyReportMetric {
  readonly label: string;
  readonly value: string | number;
  readonly icon: SvgIconComponent;
}

export interface MonthlyReportsViewModel {
  readonly reportType: "teacher" | "student";
  readonly year: number;
  readonly month: number;
  readonly selectedTeacher: PersonOption | null;
  readonly studentSelection: PersonOption | null;
  readonly teacherReport: TeacherMonthlyReportData | null;
  readonly studentReport: StudentMonthlyReportData | null;
  readonly metrics: MonthlyReportMetric[];
  readonly loading: boolean;
  readonly labels: SupervisorMonthlyReportsLabels;
  readonly onReportTypeChange: (type: "teacher" | "student") => void;
  readonly onYearChange: (year: number) => void;
  readonly onMonthChange: (month: number) => void;
  readonly onSelectedTeacherChange: (teacher: PersonOption | null) => void;
  readonly onStudentSelectionChange: (selection: PersonOption | null) => void;
  readonly onGenerate: () => void;
}

export type UseMonthlyReportsViewModelProps = Record<string, never>;

// Desktop tier presentation prop types (sub-components defined in
// `frontend/desktop/views/dashboard/supervisor/monthly-reports/monthlyReports.desktop.tsx`).
export type ReportTypeFilterProps = Readonly<{
  reportType: MonthlyReportsViewModel["reportType"];
  teacherReport: string;
  studentReport: string;
  onReportTypeChange: MonthlyReportsViewModel["onReportTypeChange"];
}>;

export type DateRangeSelectorProps = Readonly<{
  year: MonthlyReportsViewModel["year"];
  month: MonthlyReportsViewModel["month"];
  labels: Pick<MonthlyReportsViewModel["labels"], "selectYear" | "selectMonth" | "monthNames">;
  onYearChange: MonthlyReportsViewModel["onYearChange"];
  onMonthChange: MonthlyReportsViewModel["onMonthChange"];
}>;

export type TargetSelectSectionProps = Readonly<{
  reportType: MonthlyReportsViewModel["reportType"];
  selectedTeacher: MonthlyReportsViewModel["selectedTeacher"];
  studentSelection: MonthlyReportsViewModel["studentSelection"];
  labels: Pick<
    MonthlyReportsViewModel["labels"],
    "selectTeacher" | "teacherSearchPlaceholder" | "selectStudent" | "studentSearchPlaceholder"
  >;
  onSelectedTeacherChange: MonthlyReportsViewModel["onSelectedTeacherChange"];
  onStudentSelectionChange: MonthlyReportsViewModel["onStudentSelectionChange"];
}>;

export type GenerateActionProps = Readonly<{
  generateReport: string;
  onGenerate: MonthlyReportsViewModel["onGenerate"];
}>;

export type FilterPanelProps = Readonly<
  Pick<
    MonthlyReportsViewModel,
    | "reportType"
    | "year"
    | "month"
    | "selectedTeacher"
    | "studentSelection"
    | "labels"
    | "onReportTypeChange"
    | "onYearChange"
    | "onMonthChange"
    | "onSelectedTeacherChange"
    | "onStudentSelectionChange"
    | "onGenerate"
  >
>;

export type MetricsOutputProps = Readonly<{
  loading: MonthlyReportsViewModel["loading"];
  metrics: MonthlyReportsViewModel["metrics"];
  labels: Pick<MonthlyReportsViewModel["labels"], "loadingMessage" | "noDataAvailable">;
}>;

// Mobile tier presentation prop types (sub-components defined in
// `frontend/mobile/views/dashboard/supervisor/monthly-reports/monthlyReports.mobile.tsx`).
export type ReportTypeToggleProps = Readonly<{
  reportType: MonthlyReportsViewModel["reportType"];
  labels: MonthlyReportsViewModel["labels"];
  onReportTypeChange: MonthlyReportsViewModel["onReportTypeChange"];
}>;

export type PeriodFieldsProps = Readonly<{
  year: MonthlyReportsViewModel["year"];
  month: MonthlyReportsViewModel["month"];
  labels: MonthlyReportsViewModel["labels"];
  onYearChange: MonthlyReportsViewModel["onYearChange"];
  onMonthChange: MonthlyReportsViewModel["onMonthChange"];
}>;

export type ScopeSelectProps = Readonly<{
  reportType: MonthlyReportsViewModel["reportType"];
  selectedTeacher: MonthlyReportsViewModel["selectedTeacher"];
  studentSelection: MonthlyReportsViewModel["studentSelection"];
  labels: MonthlyReportsViewModel["labels"];
  onSelectedTeacherChange: MonthlyReportsViewModel["onSelectedTeacherChange"];
  onStudentSelectionChange: MonthlyReportsViewModel["onStudentSelectionChange"];
}>;

export type ReportStatusProps = Readonly<{
  loading: boolean;
  hasMetrics: boolean;
  labels: MonthlyReportsViewModel["labels"];
}>;
