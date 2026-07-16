import type { AppLocale } from "@/shared/locale/AppLocale";
import { arMessages } from "@/shared/locale/ar/messages";
import { enMessages } from "@/shared/locale/en/messages";
import type { Translations } from "@/shared/locale/types/message";

export const messagesByLocale: Record<AppLocale, Translations> = {
  ar: arMessages,
  en: enMessages,
};
