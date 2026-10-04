"use client";

import { DeleteOutlined, SaveOutlined } from "@mui/icons-material";
import { Stack } from "@mui/material";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui/button";
import { EnvSecretField } from "@/frontend/common/views/dashboard/settings/components/environment/EnvSecretField";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";

interface ValueBlockProps {
  readonly configKey: string;
  readonly displayValue: string;
  readonly editable: boolean;
  readonly saving: boolean;
  readonly dirty: boolean;
  readonly isSecret: boolean;
  readonly valueLabel: string;
  readonly emptyPlaceholder: string;
  readonly showValueLabel: string;
  readonly hideValueLabel: string;
  readonly hasDbOverride: boolean | null;
  readonly onDraftChange: (key: string, value: string) => void;
  readonly onSave: (key: string) => void;
  readonly onRevert: (key: string) => void;
  readonly labels: EnvironmentConfigViewModel["labels"];
}

export function ValueBlock({
  configKey,
  displayValue,
  editable,
  saving,
  dirty,
  isSecret,
  valueLabel,
  emptyPlaceholder,
  showValueLabel,
  hideValueLabel,
  hasDbOverride,
  onDraftChange,
  onSave,
  onRevert,
  labels,
}: ValueBlockProps) {
  const handleDraftChange = (value: string) => onDraftChange(configKey, value);
  const handleSave = () => onSave(configKey);
  const handleRevert = () => onRevert(configKey);

  return (
    <Stack sx={{ gap: 1.5, minWidth: 0 }}>
      <EnvSecretField
        configKey={configKey}
        label={valueLabel}
        value={displayValue}
        onChange={handleDraftChange}
        disabled={!editable || saving}
        readOnly={!editable}
        isSecret={isSecret}
        placeholder={displayValue ? undefined : emptyPlaceholder}
        showValueLabel={showValueLabel}
        hideValueLabel={hideValueLabel}
      />

      {editable ? (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          <PrimaryPageAction size="small" startIcon={<SaveOutlined />} disabled={!dirty || saving} onClick={handleSave}>
            {labels.actions.save}
          </PrimaryPageAction>
          {hasDbOverride ? (
            <FilterButton size="small" startIcon={<DeleteOutlined />} disabled={saving} onClick={handleRevert}>
              {labels.actions.revert}
            </FilterButton>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}
