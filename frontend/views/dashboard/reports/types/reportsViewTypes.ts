import type {
  ReportLedgerRow,
  ReportsSummary,
  ReportTeacherOption,
  ReportType,
} from "@/frontend/views/dashboard/reports/types/reportsTypes";

export interface ReportsSummaryLabels {
  readonly engagementRate: string;
  readonly engagementGrowth: string;
  readonly increase: string;
  readonly financialDistribution: string;
  readonly financialSubtitle: string;
  readonly egpLabel: string;
  readonly usdLabel: string;
}

export interface ReportsSharedState {
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
  readonly teachers: readonly ReportTeacherOption[];
  readonly rows: readonly ReportLedgerRow[];
  readonly summary: ReportsSummary;
  readonly canGenerate: boolean;
  readonly loading?: boolean;
}

export interface ReportsSharedHandlers {
  readonly onFromDateChange: (date: string) => void;
  readonly onToDateChange: (date: string) => void;
  readonly onTeacherChange: (teacherId: string) => void;
  readonly onReportTypeChange: (reportType: ReportType) => void;
  readonly onSubmit: () => void;
  readonly onExportCsv: () => void;
  readonly onPrintReport: () => void;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
}

export type ReportsSharedViewProps = ReportsSharedState & ReportsSharedHandlers;
