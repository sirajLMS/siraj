import type { GridColDef } from "@mui/x-data-grid";
import type {
  SettingsAuditLabels,
  SettingsAuditRow,
} from "@/frontend/common/views/dashboard/settings/types/settingsAudit.types";

export type SettingsAuditViewModel = {
  readonly labels: SettingsAuditLabels;
  readonly rows: readonly SettingsAuditRow[];
  readonly columns: readonly GridColDef<SettingsAuditRow>[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly loading: boolean;
  readonly entityType: string;
  readonly action: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly entityTypeOptions: readonly string[];
  readonly actionOptions: readonly string[];
  readonly onEntityTypeChange: (value: string) => void;
  readonly onActionChange: (value: string) => void;
  readonly onDateRangeChange: (fromDate: string, toDate: string) => void;
  readonly onPageChange: (page: number) => void;
};
