import type { AppLocale } from "@/shared/locale/AppLocale";
import { locales } from "@/shared/locale/AppLocale";
import { ensureBetaNamespaceLoading } from "@/shared/locale/beta/beta-translation-cache-store";
import type { BetaNamespaceHandle } from "@/shared/locale/beta/define-beta-namespace";

export function preloadBetaNamespaces(...handles: BetaNamespaceHandle<unknown>[]): void {
  for (const handle of handles) {
    for (const locale of locales as readonly AppLocale[]) {
      ensureBetaNamespaceLoading(handle, locale);
    }
  }
}
