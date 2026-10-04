import { getLanguageDisplayName, getLanguageEmoji } from "@/frontend/common/lib/locale";
import { ALLOWED_LOCALES } from "@/frontend/common/types/localized-string.types";
import { setLocalizedString } from "@/shared/lib/localized-string";
import type { AppLocale, LocalizedStringLabels } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types/localized-string";

type HelperTextParams = {
  readonly draft: LocalizedString;
  readonly required: boolean;
  readonly resolvedRequired: readonly AppLocale[];
  readonly uiLocale: string;
  readonly t: LocalizedStringLabels;
};

export function buildHelperText({
  draft,
  required,
  resolvedRequired,
  uiLocale,
  t,
}: HelperTextParams): string | undefined {
  if (!required && resolvedRequired.length === 0) {
    return undefined;
  }
  if (resolvedRequired.length > 0) {
    const missing = resolvedRequired.filter(locale => {
      const v = draft[locale];
      return !(typeof v === "string" && v.trim() !== "");
    });
    if (missing.length === 1) {
      return t.localeRequired(getLanguageDisplayName(missing[0], uiLocale));
    }
    if (missing.length > 1) {
      const names = missing.map(l => getLanguageDisplayName(l, uiLocale)).join(", ");
      return t.localesRequired(names);
    }
  }
  if (required) {
    return t.atLeastOneTranslationRequired;
  }
  return undefined;
}

export function resolveDismiss(params: {
  readonly autosave: boolean;
  readonly dismissAction: "save" | "cancel";
  readonly canSave: boolean;
  readonly draft: LocalizedString;
  readonly onSaveAction: (next: LocalizedString) => void;
  readonly onCancelAction: () => void;
}): void {
  const { autosave, dismissAction, canSave, draft, onSaveAction, onCancelAction } = params;
  if (autosave) {
    onCancelAction();
    return;
  }
  if (dismissAction === "save" && canSave) {
    onSaveAction(draft);
    return;
  }
  onCancelAction();
}

export function resolveFieldChange(params: {
  readonly draft: LocalizedString;
  readonly locale: AppLocale;
  readonly text: string;
  readonly autosave: boolean;
  readonly onSaveAction: (next: LocalizedString) => void;
  readonly setDraft: React.Dispatch<React.SetStateAction<LocalizedString>>;
}): void {
  const { draft, locale, text, autosave, onSaveAction, setDraft } = params;
  const next = setLocalizedString(draft, locale, text);
  setDraft(next);
  if (autosave) {
    onSaveAction(next);
  }
}

export type LocaleFieldConfig = {
  readonly locale: AppLocale;
  readonly isLocaleRequired: boolean;
  readonly fieldValue: string;
  readonly isRtl: boolean;
  readonly languageName: string;
  readonly emoji: string;
};

export function computeFieldConfigs(
  draft: LocalizedString,
  requiredSet: Set<AppLocale>,
  uiLocale: string
): readonly LocaleFieldConfig[] {
  return ALLOWED_LOCALES.map(locale => ({
    locale,
    isLocaleRequired: requiredSet.has(locale),
    fieldValue: draft[locale] ?? "",
    isRtl: locale === "ar",
    languageName: getLanguageDisplayName(locale, uiLocale),
    emoji: getLanguageEmoji(locale),
  }));
}

export function computeShowError(isLocaleRequired: boolean, fieldValue: string): boolean {
  return isLocaleRequired && !(typeof fieldValue === "string" && fieldValue.trim() !== "");
}
