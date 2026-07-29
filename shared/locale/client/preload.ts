import type { AppLocale } from "@/shared/locale/AppLocale";
import { locales } from "@/shared/locale/AppLocale";
import { ensureNamespaceLoading } from "@/shared/locale/client/translation-cache-store";
import type { NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";

export function preloadNamespaces(...handles: NamespaceHandle<unknown>[]): void {
  for (const handle of handles) {
    for (const locale of locales as readonly AppLocale[]) {
      ensureNamespaceLoading(handle, locale);
    }
  }
}
