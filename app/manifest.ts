import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Siraj",
    short_name: "Siraj",
    description: "Siraj Learning Management System — manage classes, schedules, students, teachers, and billing.",
    start_url: "/",
    display: "standalone",
    background_color: "#1A1A1A",
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
