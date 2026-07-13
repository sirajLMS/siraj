"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import type { Locale } from "@/shared/i18n/routing";
import { useRouter } from "@/shared/i18n/routing";

export function useLanguageSwitch() {
  const router = useRouter();
  const currentLocale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const switchLanguage = (newLocale: Locale) => {
    if (currentLocale === newLocale) return;

    startTransition(async () => {
      try {
        // Use server-side API to set locale cookie
        // This works across all hostnames (localhost, LAN IP, etc.)
        const response = await fetch("/api/set-locale", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ locale: newLocale }),
        });

        if (!response.ok) {
          throw new Error("Failed to set locale");
        }

        // Refresh the page to apply the new locale
        router.refresh();
      } catch {
        // Fallback: If API fails, refresh anyway and let server detect from browser's Accept-Language
        router.refresh();
      }
    });
  };

  return {
    currentLocale,
    switchLanguage,
    isPending,
  };
}
