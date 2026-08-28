import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import type { ReactNode } from "react";
import { MeetingIntegrationConnectedAccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export type StatusFilterSelectProps = {
  readonly value: MeetingIntegrationConnectedAccountStatus | "all";
  readonly onChange: (value: MeetingIntegrationConnectedAccountStatus | "all") => void;
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly minWidth?: number;
};

export function StatusFilterSelect({
  value,
  onChange,
  labels,
  minWidth = 140,
}: Readonly<StatusFilterSelectProps>): ReactNode {
  const labelId = "meeting-accounts-status-filter-label";
  return (
    <FormControl size="small" sx={{ minWidth }}>
      <InputLabel id={labelId} shrink>
        {labels.columns.status}
      </InputLabel>
      <Select<MeetingIntegrationConnectedAccountStatus | "all">
        labelId={labelId}
        label={labels.columns.status}
        value={value}
        onChange={(e: SelectChangeEvent<MeetingIntegrationConnectedAccountStatus | "all">) => {
          const val = e.target.value;
          onChange(val === "all" ? "all" : val);
        }}
      >
        <MenuItem value="all">{labels.filters.statusAll}</MenuItem>
        <MenuItem value={MeetingIntegrationConnectedAccountStatus.Connected}>{labels.status.connected}</MenuItem>
        <MenuItem value={MeetingIntegrationConnectedAccountStatus.ExpiringSoon}>{labels.status.expiringSoon}</MenuItem>
        <MenuItem value={MeetingIntegrationConnectedAccountStatus.ReauthNeeded}>{labels.status.reauthNeeded}</MenuItem>
        <MenuItem value={MeetingIntegrationConnectedAccountStatus.Revoked}>{labels.status.revoked}</MenuItem>
      </Select>
    </FormControl>
  );
}
