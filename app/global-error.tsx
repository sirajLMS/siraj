"use client";

import type { CSSProperties } from "react";
import { readCookie } from "@/app/global-error.helpers";
import { DATABASE_UNAVAILABLE_DIGEST } from "@/shared/constants";

/**
 * Last-resort error boundary for failures thrown by the root layout itself
 * (where `app/error.tsx` cannot render, because `error.tsx` does not wrap its
 * own segment's layout). Must define its own `<html>`/`<body>` and cannot rely
 * on any provider (theme, i18n, MUI), so it carries a tiny inline copy map and
 * plain CSS — MUI/theme tokens are unavailable at this level by design.
 */

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
  readonly retry: () => void;
}

interface GlobalErrorCopy {
  readonly title: string;
  readonly description: string;
  readonly retry: string;
}

interface GlobalErrorStrings {
  readonly database: GlobalErrorCopy;
  readonly generic: GlobalErrorCopy;
}

const GLOBAL_ERROR_STRINGS: Record<"en" | "ar", GlobalErrorStrings> = {
  en: {
    database: {
      title: "We're having trouble reaching our servers",
      description: "The service is temporarily unavailable. Please try again in a few moments.",
      retry: "Try again",
    },
    generic: {
      title: "Something went wrong",
      description: "An unexpected error occurred. Please try again.",
      retry: "Try again",
    },
  },
  ar: {
    database: {
      title: "تعذّر الوصول إلى خوادمنا حالياً",
      description: "الخدمة غير متاحة مؤقتاً. يرجى المحاولة مرة أخرى بعد لحظات.",
      retry: "حاول مرة أخرى",
    },
    generic: {
      title: "حدث خطأ ما",
      description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
      retry: "حاول مرة أخرى",
    },
  },
};

function resolveLocale(): "en" | "ar" {
  return readCookie("NEXT_LOCALE") === "ar" ? "ar" : "en";
}

function resolveTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export default function GlobalError({ error, retry }: Readonly<GlobalErrorProps>) {
  const locale = resolveLocale();
  const theme = resolveTheme();
  const isDatabase = error.digest === DATABASE_UNAVAILABLE_DIGEST;
  const strings = GLOBAL_ERROR_STRINGS[locale];
  const copy = isDatabase ? strings.database : strings.generic;

  const colors =
    theme === "dark"
      ? { background: "#10141a", text: "#f1f5f9", muted: "#94a3b8", accent: "#2dd4bf", accentText: "#06231f" }
      : { background: "#f8fafc", text: "#0f172a", muted: "#64748b", accent: "#0d9488", accentText: "#ffffff" };

  const bodyStyle: CSSProperties = {
    margin: 0,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    textAlign: "center",
  };

  const buttonStyle: CSSProperties = {
    marginTop: "24px",
    padding: "12px 28px",
    fontSize: "16px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: colors.accent,
    color: colors.accentText,
  };

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-theme={theme}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <body style={bodyStyle}>
        <main>
          <h1 style={{ margin: "0 0 12px", fontSize: "28px", fontWeight: 700 }}>{copy.title}</h1>
          <p style={{ margin: 0, maxWidth: "420px", color: colors.muted, lineHeight: 1.6 }}>{copy.description}</p>
          <button type="button" onClick={retry} style={buttonStyle}>
            {copy.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
