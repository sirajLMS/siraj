import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const locales = ["ar", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales: locales,
  defaultLocale: "ar",
  localePrefix: "never", // This removes the locale from the URL
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
