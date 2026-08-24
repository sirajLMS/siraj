import type { MetadataRoute } from "next";
import { AppearanceSettingsService } from "@/backend/services";
import { FALLBACK_BG_TOKEN, FALLBACK_THEME_TOKEN } from "@/shared/constants/brand-tokens";
import { getTranslations } from "@/shared/locale/server";
import { getLocale } from "@/shared/locale/server-cookies";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getLocale();
  const t = getTranslations(locale);

  const appearance = await AppearanceSettingsService.getFirstAppearancePublished().catch(() => null);
  const themeColor = appearance?.colors.dark.primaryMain ?? FALLBACK_THEME_TOKEN;

  return {
    name: t.commonTranslations.title,
    short_name: t.commonTranslations.title,
    description: t.commonTranslations.description,
    start_url: "/",
    display: "standalone",
    background_color: FALLBACK_BG_TOKEN,
    theme_color: themeColor,
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
