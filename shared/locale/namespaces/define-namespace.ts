import type { AppLocale } from "@/shared/locale/AppLocale";
import { registerNamespace } from "@/shared/locale/client/namespace-registry";

export interface NamespaceHandle<TLabels> {
  readonly __labels?: TLabels;
}

export interface NamespaceLoaderConfig<TLabels> {
  readonly load: Record<AppLocale, () => Promise<TLabels>>;
}

export function defineNamespace<TLabels>(config: NamespaceLoaderConfig<TLabels>): NamespaceHandle<TLabels> {
  const handle = {} as NamespaceHandle<TLabels>;
  registerNamespace(handle, config);
  return handle;
}
