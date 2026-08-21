import type { EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { EnvConfigGroupedEntries } from "@/frontend/common/views/dashboard/settings/utils/environmentConfig.utils";

export type EnvironmentConfigViewModel = {
  readonly labels: import("@/shared/locale/types/dashboard/settings/environment").SettingsEnvironmentLabels;
  readonly locale: "en" | "ar";
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly groupedEntries: readonly EnvConfigGroupedEntries[];
  readonly canEdit: boolean;
  readonly draftValues: Readonly<Record<string, string>>;
  readonly savingKeys: Readonly<Record<string, boolean>>;
  readonly onDraftChange: (key: string, value: string) => void;
  readonly onSave: (key: string) => Promise<void>;
  readonly onRevert: (key: string) => Promise<void>;
  readonly getDisplayValue: (entry: EnvConfigEntryFieldsFragment) => string;
  readonly isEntryDirty: (entry: EnvConfigEntryFieldsFragment) => boolean;
  readonly isEntrySaving: (key: string) => boolean;
  readonly isCategoryExpanded: (category: string) => boolean;
  readonly onCategoryExpandedChange: (category: string, expanded: boolean) => void;
};
