import type { SettingsTimezonesLabels } from "@/shared/locale/types/dashboard/settings/timezones";

export const dashboardSettingsTimezonesEn: SettingsTimezonesLabels = {
  emptyMessage: "No timezones match your search.",
  searchPlaceholder: "Search by IANA ID or name…",
  searchingLabel: "Searching…",
  columns: {
    ianaId: "IANA ID",
    name: "Name",
    offsetMinutes: "UTC Offset",
    isDstSupported: "DST Supported",
  },
  dstSupportedYes: "Yes",
  dstSupportedNo: "No",
  offsetUtcPrefix: "UTC",
};
