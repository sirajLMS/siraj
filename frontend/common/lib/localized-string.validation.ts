import { z } from "zod";
import type { AppLocale } from "@/shared/i18n/routing";
import { omitEmptyLocalizedString } from "@/shared/lib/localized-string";
import { DEFAULT_CONTENT_LOCALE, type LocalizedString } from "@/shared/types/localized-string";

export type { AppLocale };

interface LocalizedStringRefineIssue {
  readonly message: string;
  readonly missing?: readonly AppLocale[];
}

function buildRefineIssue(map: LocalizedString, required: readonly AppLocale[]): LocalizedStringRefineIssue | null {
  const hasAny = Object.values(map).some(v => typeof v === "string" && v.trim() !== "");
  if (!hasAny) {
    return { message: "atLeastOneTranslationRequired" };
  }
  if (required.length === 0) {
    return null;
  }
  const missing = required.filter(locale => {
    const v = map[locale];
    return !(typeof v === "string" && v.trim() !== "");
  });
  if (missing.length === 0) {
    return null;
  }
  return {
    message: missing.length === 1 ? `localeRequired:${missing[0]}` : `localesRequired:${missing.join(",")}`,
    missing,
  };
}

/**
 * Zod schema for a required localized-string field.
 *
 * Defaults `requiredLocales` to `[DEFAULT_CONTENT_LOCALE]`. Errors:
 *  - `atLeastOneTranslationRequired` — no non-empty entry at all
 *  - `localeRequired:<code>` / `localesRequired:<a,b>` — required locale missing
 */
export function localizedStringRequiredSchema(requiredLocales?: readonly AppLocale[]) {
  const required = requiredLocales ?? [DEFAULT_CONTENT_LOCALE];
  return z
    .record(z.string(), z.string())
    .transform((map): LocalizedString => omitEmptyLocalizedString(map as LocalizedString))
    .superRefine((map: LocalizedString, ctx): void => {
      const issue = buildRefineIssue(map, required);
      if (issue) {
        ctx.addIssue({ code: "custom", message: issue.message });
      }
    });
}

/**
 * Zod schema for an optional localized-string field.
 *
 * Empty maps pass; if any entry is present, every required locale must be filled.
 */
export function localizedStringOptionalSchema(requiredLocales?: readonly AppLocale[]) {
  const required = requiredLocales ?? [];
  return z
    .record(z.string(), z.string())
    .transform((map): LocalizedString => omitEmptyLocalizedString(map as LocalizedString))
    .superRefine((map: LocalizedString, ctx): void => {
      const hasAny = Object.values(map).some(v => typeof v === "string" && v.trim() !== "");
      if (!hasAny) {
        return;
      }
      const issue = buildRefineIssue(map, required);
      if (issue) {
        ctx.addIssue({ code: "custom", message: issue.message });
      }
    });
}
