import type { GridColDef } from "@mui/x-data-grid";

export type SettingsAuditRow = {
  readonly id: string;
  readonly createdAt: string;
  readonly entityType: string;
  readonly action: string;
  readonly description: string;
  readonly actorUserId: string;
  readonly entityId: string;
};

type SettingsAuditFilterLabels = {
  readonly entityType: string;
  readonly action: string;
  readonly dateRange: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly all: string;
};

export type SettingsAuditColumnLabels = {
  readonly createdAt: string;
  readonly entityType: string;
  readonly action: string;
  readonly description: string;
  readonly actor: string;
  readonly entityId: string;
};

export type SettingsAuditLabels = {
  readonly emptyMessage: string;
  readonly filters: SettingsAuditFilterLabels;
  readonly columns: SettingsAuditColumnLabels;
  readonly entityTypes: Record<string, string>;
  readonly actions: Record<string, string>;
};

export type SettingsAuditDataGridProps = {
  readonly rows: readonly SettingsAuditRow[];
  readonly columns: readonly GridColDef<SettingsAuditRow>[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly loading: boolean;
  readonly emptyMessage: string;
  readonly onPageChange: (page: number) => void;
};

export type SettingsAuditFilterBarProps = {
  readonly labels: SettingsAuditFilterLabels;
  readonly entityType: string;
  readonly action: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly entityTypeOptions: readonly string[];
  readonly actionOptions: readonly string[];
  readonly entityTypeLabels: Record<string, string>;
  readonly actionLabels: Record<string, string>;
  readonly onEntityTypeChange: (value: string) => void;
  readonly onActionChange: (value: string) => void;
  readonly onDateRangeChange: (fromDate: string, toDate: string) => void;
};
