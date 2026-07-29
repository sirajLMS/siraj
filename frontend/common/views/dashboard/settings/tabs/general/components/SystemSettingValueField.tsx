"use client";

import { Switch, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { SystemSettingDataType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SystemSettingRow } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";

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
}: Readonly<SystemSettingValueFieldProps>) {
  const [draftValue, setDraftValue] = useState(row.value);

  useEffect(() => {
    setDraftValue(row.value);
  }, [row.value]);

  const commitValue = (nextValue: string): void => {
    if (nextValue === row.value) {
      return;
    }
    void onValueChange(row.code, nextValue);
  };

  if (!canEdit) {
    if (row.dataType === SystemSettingDataType.Boolean) {
      return <Switch checked={row.value === "true"} readOnly size="small" disabled />;
    }
    return row.value;
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
        slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: "0.85rem" } } }}
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
