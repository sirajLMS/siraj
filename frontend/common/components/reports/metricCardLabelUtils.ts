import type { useAppTranslation } from "@/shared/locale";

export function resolveDashboardTranslation(
  path: string,
  translations: ReturnType<typeof useAppTranslation>
): string | undefined {
  const parts = path.split(".");
  let ns = parts[1];
  if (ns === "statusTracking") {
    ns = "coreStatusTracking";
  }
  const section = translations.dashboardTranslations[ns as keyof typeof translations.dashboardTranslations];
  if (!section) {
    return undefined;
  }
  let curr: unknown = section;
  for (let i = 2; i < parts.length; i++) {
    if (curr && typeof curr === "object") {
      curr = (curr as Record<string, unknown>)[parts[i]];
    } else {
      return undefined;
    }
  }
  return typeof curr === "string" ? curr : undefined;
}

export function resolveMetricLabel(path: string, translations: ReturnType<typeof useAppTranslation>): string {
  if (path.startsWith("dashboard.")) {
    const val = resolveDashboardTranslation(path, translations);
    if (val !== undefined) {
      return val;
    }
  } else if (path.startsWith("metrics.")) {
    const parts = path.split(".");
    const resolved =
      translations.dashboardTranslations.coreStatusTracking.metrics[
        parts[1] as keyof typeof translations.dashboardTranslations.coreStatusTracking.metrics
      ];
    if (typeof resolved === "string") {
      return resolved;
    }
  }

  const commonT = translations.commonTranslations as unknown as Record<string, unknown>;
  if (path in commonT && typeof commonT[path] === "string") {
    return commonT[path] as string;
  }

  return path;
}
