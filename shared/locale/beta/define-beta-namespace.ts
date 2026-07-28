import type { AppLocale } from "@/shared/locale/AppLocale";
import { registerBetaNamespace } from "@/shared/locale/beta/beta-namespace-registry";

export interface BetaNamespaceHandle<TLabels> {
  readonly __labels?: TLabels;
}

export interface BetaNamespaceLoaderConfig<TLabels> {
  readonly load: Record<AppLocale, () => Promise<TLabels>>;
}

export function defineBetaNamespace<TLabels>(config: BetaNamespaceLoaderConfig<TLabels>): BetaNamespaceHandle<TLabels> {
  const handle = {} as BetaNamespaceHandle<TLabels>;
  registerBetaNamespace(handle, config);
  return handle;
}
