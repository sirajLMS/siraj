import type { GridColDef } from "@mui/x-data-grid";
import type { SettingsTimezonesLabels } from "@/shared/locale/types/dashboard/settings/timezones";

export type SettingsTimezoneRow = {
  readonly id: string;
  readonly ianaId: string;
  readonly name: string;
  readonly offsetMinutes: number;
  readonly offsetLabel: string;
  readonly isDstSupported: boolean;
  readonly isDstSupportedLabel: string;
};

export type SettingsTimezonesSearchBarProps = {
  readonly value: string;
  readonly placeholder: string;
  readonly searchingLabel: string;
  readonly isSearching: boolean;
  readonly onChange: (value: string) => void;
};

export type SettingsTimezonesDataGridProps = {
  readonly rows: readonly SettingsTimezoneRow[];
  readonly columns: readonly GridColDef<SettingsTimezoneRow>[];
  readonly loading: boolean;
  readonly emptyMessage: string;
  readonly paginationMode: "client" | "server";
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
};

export type SettingsTimezonesViewModel = {
  readonly labels: SettingsTimezonesLabels;
  readonly rows: readonly SettingsTimezoneRow[];
  readonly columns: readonly GridColDef<SettingsTimezoneRow>[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly loading: boolean;
  readonly searchQuery: string;
  readonly isSearchPending: boolean;
  readonly paginationMode: "client" | "server";
  readonly onSearchChange: (value: string) => void;
  readonly onPageChange: (page: number) => void;
};

export type { SettingsTimezonesLabels };
