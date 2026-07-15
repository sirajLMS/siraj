"use client";

import { useParams } from "next/navigation";
import { type AppLocale, defaultLocale } from "@/shared/locale/AppLocale";

function isAppLocale(value: unknown): value is AppLocale {
  return value === "ar" || value === "en";
}

export function useAppLocale(): AppLocale {
  const params = useParams();
  const localeParam = params?.locale;
  const value = Array.isArray(localeParam) ? localeParam[0] : localeParam;
  return isAppLocale(value) ? value : defaultLocale;
}
