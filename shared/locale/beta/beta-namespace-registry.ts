import type { BetaNamespaceHandle, BetaNamespaceLoaderConfig } from "@/shared/locale/beta/define-beta-namespace";

const betaNamespaceRegistry = new Map<BetaNamespaceHandle<unknown>, BetaNamespaceLoaderConfig<unknown>>();

export function registerBetaNamespace<TLabels>(
  handle: BetaNamespaceHandle<TLabels>,
  config: BetaNamespaceLoaderConfig<TLabels>
): void {
  betaNamespaceRegistry.set(handle as BetaNamespaceHandle<unknown>, config as BetaNamespaceLoaderConfig<unknown>);
}

export function getBetaNamespaceConfig<TLabels>(
  handle: BetaNamespaceHandle<TLabels>
): BetaNamespaceLoaderConfig<TLabels> | undefined {
  return betaNamespaceRegistry.get(handle as BetaNamespaceHandle<unknown>) as
    | BetaNamespaceLoaderConfig<TLabels>
    | undefined;
}
