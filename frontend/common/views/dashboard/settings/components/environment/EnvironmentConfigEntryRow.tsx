"use client";

import { DeleteOutlined, SaveOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { EnvSecretField } from "@/frontend/common/views/dashboard/settings/components/environment/EnvSecretField";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";
import {
  isEnvConfigSecretEntry,
  resolveLocalizedEnvDescription,
} from "@/frontend/common/views/dashboard/settings/utils/environmentConfig.utils";

type EnvironmentConfigEntryRowProps = {
  readonly entry: EnvConfigEntryFieldsFragment;
  readonly viewModel: EnvironmentConfigViewModel;
  readonly layout?: "grid" | "stacked";
};

function resolveSourceLabel(source: string | null | undefined, labels: EnvironmentConfigViewModel["labels"]): string {
  switch (source) {
    case "db":
      return labels.source.db;
    case "env":
      return labels.source.env;
    case "unset":
      return labels.source.unset;
    default:
      return labels.source.unset;
  }
}

interface KeyBlockProps {
  readonly key: string;
  readonly description: string | undefined;
  readonly editable: boolean;
  readonly labels: EnvironmentConfigViewModel["labels"];
}

function KeyBlock({ key, description, editable, labels }: KeyBlockProps) {
  return (
    <Stack sx={{ gap: 0.75, minWidth: 0 }}>
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary" }}>{labels.columns.key}</Typography>
      <Typography
        sx={{
          typography: "bodyMd",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {key}
      </Typography>
      {description ? (
        <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{description}</Typography>
      ) : null}
      {!editable ? (
        <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{labels.readOnlyHint}</Typography>
      ) : null}
    </Stack>
  );
}

interface SourceBlockProps {
  readonly sourceLabel: string;
  readonly hasDbOverride: boolean | null;
  readonly labels: EnvironmentConfigViewModel["labels"];
}

function SourceBlock({ sourceLabel, hasDbOverride, labels }: SourceBlockProps) {
  return (
    <Stack sx={{ gap: 1, minWidth: 0 }}>
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary" }}>{labels.columns.source}</Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        <Chip size="small" variant="outlined" label={sourceLabel} />
        {hasDbOverride ? (
          <Chip size="small" color="primary" variant="outlined" label={labels.badges.dbOverride} />
        ) : null}
      </Stack>
    </Stack>
  );
}

interface ValueBlockProps {
  readonly key: string;
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

function ValueBlock({
  key,
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
  return (
    <Stack sx={{ gap: 1.5, minWidth: 0 }}>
      <EnvSecretField
        configKey={key}
        label={valueLabel}
        value={displayValue}
        onChange={value => {
          onDraftChange(key, value);
        }}
        disabled={!editable || saving}
        readOnly={!editable}
        isSecret={isSecret}
        placeholder={displayValue ? undefined : emptyPlaceholder}
        showValueLabel={showValueLabel}
        hideValueLabel={hideValueLabel}
      />

      {editable ? (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveOutlined />}
            disabled={!dirty || saving}
            onClick={() => {
              void onSave(key);
            }}
          >
            {labels.actions.save}
          </Button>
          {hasDbOverride ? (
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<DeleteOutlined />}
              disabled={saving}
              onClick={() => {
                void onRevert(key);
              }}
            >
              {labels.actions.revert}
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}

interface LayoutBlockProps {
  readonly keyBlock: React.ReactNode;
  readonly sourceBlock: React.ReactNode;
  readonly valueBlock: React.ReactNode;
  readonly layout: "grid" | "stacked";
}

function LayoutBlock({ keyBlock, sourceBlock, valueBlock, layout }: LayoutBlockProps) {
  if (layout === "stacked") {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          py: 2,
          borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
          width: "100%",
        }}
      >
        {keyBlock}
        {sourceBlock}
        {valueBlock}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        py: 2,
        borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
        width: "100%",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1.6fr)",
        },
      }}
    >
      {keyBlock}
      {sourceBlock}
      {valueBlock}
    </Box>
  );
}

export function EnvironmentConfigEntryRow({
  entry,
  viewModel,
  layout = "grid",
}: Readonly<EnvironmentConfigEntryRowProps>) {
  const { labels, locale, canEdit, onDraftChange, onSave, onRevert, getDisplayValue, isEntryDirty, isEntrySaving } =
    viewModel;

  const key = entry.key ?? "";
  const isSecret = isEnvConfigSecretEntry(entry);
  const editable = entry.editable === true && canEdit;
  const displayValue = getDisplayValue(entry);
  const description = resolveLocalizedEnvDescription(entry.description, locale);
  const saving = isEntrySaving(key);
  const dirty = isEntryDirty(entry);
  const sourceLabel = resolveSourceLabel(entry.source, labels);
  const valueLabel = labels.columns.value;
  const emptyPlaceholder = labels.emptyValue;

  const keyBlock = <KeyBlock key={key} description={description} editable={editable} labels={labels} />;
  const sourceBlock = <SourceBlock sourceLabel={sourceLabel} hasDbOverride={entry.hasDbOverride} labels={labels} />;
  const valueBlock = (
    <ValueBlock
      key={key}
      displayValue={displayValue}
      editable={editable}
      saving={saving}
      dirty={dirty}
      isSecret={isSecret}
      valueLabel={valueLabel}
      emptyPlaceholder={emptyPlaceholder}
      showValueLabel={labels.actions.showValue}
      hideValueLabel={labels.actions.hideValue}
      hasDbOverride={entry.hasDbOverride}
      onDraftChange={onDraftChange}
      onSave={onSave}
      onRevert={onRevert}
      labels={labels}
    />
  );

  return <LayoutBlock keyBlock={keyBlock} sourceBlock={sourceBlock} valueBlock={valueBlock} layout={layout} />;
}
