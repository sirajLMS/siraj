"use client";

import { useAppLocale, useLocaleContext } from "@/shared/locale/localeContext";
import type { MessageSchema } from "@/shared/locale/types/message";

/**
 * Client-side translation hook. Returns the translations for the given
 * namespace with full compile-time type safety.
 *
 * The namespace must have been loaded by the server layout and passed
 * into <LocaleProvider> before this hook can be used.
 *
 * Usage:
 *   // Instead of: const t = useTranslations("auth.login")
 *   const t = useAppTranslation("auth").login;
 *   return <label>{t.email}</label>; // ← compile-time checked, autocompleted
 *
 *   // For functions (interpolation / pluralization):
 *   const t = useAppTranslation("auth").impersonation;
 *   return <p>{t.bannerLoggedInAs("أحمد")}</p>; // ← typed arguments
 */
export function useAppTranslation<K extends keyof MessageSchema>(namespace: K): MessageSchema[K] {
  const ctx = useLocaleContext();
  const value = ctx.translations[namespace];
  if (!value) {
    throw new Error(
      `[useAppTranslation] Namespace "${String(namespace)}" was not loaded. ` +
        `Make sure to pass it to <LocaleProvider> in the layout.`
    );
  }
  return value as MessageSchema[K];
}

export { useAppLocale };
