import type { AppLocale, LocalizedString } from "@/frontend/common/types/localized-string.types";

export type LocalizedStringDrawerProps = {
  readonly open: boolean;
  readonly value: LocalizedString;
  readonly title?: string;
  readonly multiline?: boolean;
  readonly minRows?: number;
  readonly required?: boolean;
  readonly requiredLocales?: readonly AppLocale[];
  readonly onSaveAction: (next: LocalizedString) => void;
  readonly onCancelAction: () => void;
  readonly saving?: boolean;
  readonly autosave?: boolean;
  readonly showActions?: boolean;
  readonly dismissAction?: "save" | "cancel";
};
