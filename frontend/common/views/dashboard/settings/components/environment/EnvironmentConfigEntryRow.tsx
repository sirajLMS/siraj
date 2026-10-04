"use client";

import type { EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { resolveSourceLabel } from "@/frontend/common/views/dashboard/settings/components/environment/EnvironmentConfigEntryRow.helpers";
import {
  KeyBlock,
  LayoutBlock,
  SourceBlock,
} from "@/frontend/common/views/dashboard/settings/components/environment/EnvironmentConfigEntryRow.parts";
import { ValueBlock } from "@/frontend/common/views/dashboard/settings/components/environment/EnvironmentConfigEntryRow.valueBlock.parts";
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

export function EnvironmentConfigEntryRow({
  entry,
  viewModel,
  layout = "grid",
}: Readonly<EnvironmentConfigEntryRowProps>) {
  const { labels, locale, canEdit, onDraftChange, onSave, onRevert, getDisplayValue, isEntryDirty, isEntrySaving } =
    viewModel;

  const entryKey = entry.key ?? "";
  const isSecret = isEnvConfigSecretEntry(entry);
  const editable = entry.editable === true && canEdit;
  const displayValue = getDisplayValue(entry);
  const description = resolveLocalizedEnvDescription(entry.description, locale);
  const saving = isEntrySaving(entryKey);
  const dirty = isEntryDirty(entry);
  const sourceLabel = resolveSourceLabel(entry.source, labels);
  const valueLabel = labels.columns.value;
  const emptyPlaceholder = labels.emptyValue;

  const keyBlock = <KeyBlock configKey={entryKey} description={description} editable={editable} labels={labels} />;
  const sourceBlock = (
    <SourceBlock source={entry.source} sourceLabel={sourceLabel} hasDbOverride={entry.hasDbOverride} labels={labels} />
  );
  const valueBlock = (
    <ValueBlock
      configKey={entryKey}
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
