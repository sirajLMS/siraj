"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import { AppDateRangePicker, outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { SettingsAuditFilterBarProps } from "@/frontend/common/views/dashboard/settings/types/settingsAudit.types";

export function SettingsAuditFilterBar({
  labels,
  entityType,
  action,
  fromDate,
  toDate,
  entityTypeOptions,
  actionOptions,
  entityTypeLabels,
  actionLabels,
  onEntityTypeChange,
  onActionChange,
  onDateRangeChange,
}: Readonly<SettingsAuditFilterBarProps>) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      sx={{
        flexWrap: "wrap",
        gap: 2,
        alignItems: { xs: "stretch", md: "center" },
      }}
    >
      <Box sx={{ minWidth: { xs: "100%", md: 180 } }}>
        <FormControl fullWidth size="small" sx={outlinedInputSx}>
          <InputLabel id="settings-audit-entity-type-label" shrink>
            {labels.entityType}
          </InputLabel>
          <Select
            labelId="settings-audit-entity-type-label"
            label={labels.entityType}
            value={entityType}
            onChange={event => {
              onEntityTypeChange(event.target.value);
            }}
            displayEmpty
          >
            <MenuItem value="">{labels.all}</MenuItem>
            {entityTypeOptions.map(option => (
              <MenuItem key={option} value={option}>
                {entityTypeLabels[option] ?? option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ minWidth: { xs: "100%", md: 180 } }}>
        <FormControl fullWidth size="small" sx={outlinedInputSx}>
          <InputLabel id="settings-audit-action-label" shrink>
            {labels.action}
          </InputLabel>
          <Select
            labelId="settings-audit-action-label"
            label={labels.action}
            value={action}
            onChange={event => {
              onActionChange(event.target.value);
            }}
            displayEmpty
          >
            <MenuItem value="">{labels.all}</MenuItem>
            {actionOptions.map(option => (
              <MenuItem key={option} value={option}>
                {actionLabels[option] ?? option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 280px" }, minWidth: { md: 280 } }}>
        <AppDateRangePicker
          label={labels.dateRange}
          fromLabel={labels.fromDate}
          toLabel={labels.toDate}
          fromDate={fromDate}
          toDate={toDate}
          onChange={onDateRangeChange}
          size="small"
        />
      </Box>
    </Stack>
  );
}
