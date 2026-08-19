"use client";

import { Box, Switch, TextField } from "@mui/material";
import { type ReactNode, useState } from "react";
import type { SystemSettingRow } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import { SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

export interface SystemSettingValueFieldProps {
  readonly row: SystemSettingRow;
  readonly canEdit: boolean;
  readonly disabled?: boolean;
  readonly onValueChange: (code: string, value: string) => void | Promise<void>;
}

export function SystemSettingValueField({
  row,
  canEdit,
  disabled = false,
  onValueChange,
}: Readonly<SystemSettingValueFieldProps>): ReactNode {
  const [draftValue, setDraftValue] = useState(row.value);
  const [prevRowValue, setPrevRowValue] = useState(row.value);
  if (row.value !== prevRowValue) {
    setPrevRowValue(row.value);
    setDraftValue(row.value);
  }

  const commitValue = (nextValue: string): Promise<void> | void | undefined => {
    if (nextValue === row.value) {
      return undefined;
    }
    return onValueChange(row.code, nextValue);
  };

  if (!canEdit) {
    if (row.dataType === SystemSettingDataType.Boolean) {
      return <Switch checked={row.value === "true"} readOnly size="small" disabled />;
    }
    return <Box component="span">{row.value}</Box>;
  }

  if (row.dataType === SystemSettingDataType.Boolean) {
    return (
      <Switch
        checked={row.value === "true"}
        disabled={disabled}
        size="small"
        onChange={event => {
          void onValueChange(row.code, event.target.checked ? "true" : "false");
        }}
      />
    );
  }

  if (row.dataType === SystemSettingDataType.Integer) {
    return (
      <TextField
        value={draftValue}
        disabled={disabled}
        fullWidth
        size="small"
        type="number"
        slotProps={{ htmlInput: { min: 0 } }}
        onChange={event => setDraftValue(event.target.value)}
        onBlur={() => commitValue(draftValue.trim())}
      />
    );
  }

  if (row.dataType === SystemSettingDataType.Json) {
    return (
      <TextField
        value={draftValue}
        disabled={disabled}
        fullWidth
        size="small"
        multiline
        minRows={2}
        slotProps={{
          input: { sx: theme => ({ fontFamily: "monospace", fontSize: theme.typography.bodyMd.fontSize }) },
        }}
        onChange={event => setDraftValue(event.target.value)}
        onBlur={() => commitValue(draftValue)}
      />
    );
  }

  return (
    <TextField
      value={draftValue}
      disabled={disabled}
      fullWidth
      size="small"
      onChange={event => setDraftValue(event.target.value)}
      onBlur={() => commitValue(draftValue.trim())}
    />
  );
}
