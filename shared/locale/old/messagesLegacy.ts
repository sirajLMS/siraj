import type { AppLocale } from "@/shared/locale/AppLocale.ts";
import { arMessages } from "@/shared/locale/ar/old/messages.ts";
import { enMessages } from "@/shared/locale/en/old/messages.ts";
import type { Translations } from "@/shared/locale/types/old/message.ts";

export const messagesByLocale: Record<AppLocale, Translations> = {
  ar: arMessages,
  en: enMessages,
};
