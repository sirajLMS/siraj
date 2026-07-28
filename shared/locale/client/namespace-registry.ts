import type { NamespaceHandle, NamespaceLoaderConfig } from "@/shared/locale/namespaces/define-namespace";

const namespaceRegistry = new Map<NamespaceHandle<unknown>, NamespaceLoaderConfig<unknown>>();

export function registerNamespace<TLabels>(
  handle: NamespaceHandle<TLabels>,
  config: NamespaceLoaderConfig<TLabels>
): void {
  namespaceRegistry.set(handle as NamespaceHandle<unknown>, config as NamespaceLoaderConfig<unknown>);
}

export function getNamespaceConfig<TLabels>(
  handle: NamespaceHandle<TLabels>
): NamespaceLoaderConfig<TLabels> | undefined {
  return namespaceRegistry.get(handle as NamespaceHandle<unknown>) as NamespaceLoaderConfig<TLabels> | undefined;
}
