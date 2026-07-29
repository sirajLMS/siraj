import type { GridColDef } from "@mui/x-data-grid";
import { formatOffsetFromMinutes } from "@/frontend/common/lib/timezone";
import { SETTINGS_TIMEZONES_PAGE_SIZE } from "@/frontend/common/stores/settingsTimezonesStore";
import type {
  SettingsTimezoneRow,
  SettingsTimezonesLabels,
} from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";

type SettingsTimezoneSource = {
  readonly id: string | null;
  readonly ianaId: string | null;
  readonly name: string | null;
  readonly offsetMinutes: number | null;
  readonly isDstSupported: boolean | null;
};

export function matchesSearchQuery(row: SettingsTimezoneRow, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return row.ianaId.toLowerCase().includes(normalizedQuery) || row.name.toLowerCase().includes(normalizedQuery);
}

export function toSettingsTimezoneRow(
  timezone: SettingsTimezoneSource,
  labels: SettingsTimezonesLabels,
  index: number
): SettingsTimezoneRow | null {
  if (!timezone.ianaId) {
    return null;
  }

  const offsetMinutes = timezone.offsetMinutes ?? 0;
  const isDstSupported = timezone.isDstSupported ?? false;

  return {
    id: timezone.id ?? `${timezone.ianaId}-${index}`,
    ianaId: timezone.ianaId,
    name: timezone.name ?? timezone.ianaId,
    offsetMinutes,
    offsetLabel: `${labels.offsetUtcPrefix}${formatOffsetFromMinutes(offsetMinutes)}`,
    isDstSupported,
    isDstSupportedLabel: isDstSupported ? labels.dstSupportedYes : labels.dstSupportedNo,
  };
}

export function mapSettingsTimezoneRows(
  timezones: readonly SettingsTimezoneSource[],
  labels: SettingsTimezonesLabels
): readonly SettingsTimezoneRow[] {
  return timezones
    .map((timezone, index) => toSettingsTimezoneRow(timezone, labels, index))
    .filter((row): row is SettingsTimezoneRow => row != null);
}

export function buildSettingsTimezoneColumns(
  labels: SettingsTimezonesLabels
): readonly GridColDef<SettingsTimezoneRow>[] {
  return [
    { field: "ianaId", headerName: labels.columns.ianaId, flex: 1.2, minWidth: 180 },
    { field: "name", headerName: labels.columns.name, flex: 1.2, minWidth: 180 },
    { field: "offsetLabel", headerName: labels.columns.offsetMinutes, flex: 0.8, minWidth: 120 },
    {
      field: "isDstSupportedLabel",
      headerName: labels.columns.isDstSupported,
      flex: 0.8,
      minWidth: 140,
    },
  ];
}

export function buildSettingsTimezonesPaginationArgs(page: number, isSearchActive: boolean) {
  if (isSearchActive) {
    return null;
  }

  return {
    first: SETTINGS_TIMEZONES_PAGE_SIZE,
    skip: null,
    after: null,
    before: null,
    last: null,
    page: page + 1,
    maxCount: SETTINGS_TIMEZONES_PAGE_SIZE,
  };
}
