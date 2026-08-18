import type { MetadataRoute } from "next";
import { getTranslations } from "@/shared/locale/server";
import { getLocale } from "@/shared/locale/server-cookies";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getLocale();
  const t = getTranslations(locale);

  return {
    name: "Siraj",
    short_name: "Siraj",
    description: t.commonTranslations.description,
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#2DD4BF",
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
