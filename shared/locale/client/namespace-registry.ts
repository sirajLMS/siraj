import type { NamespaceHandle, NamespaceLoaderConfig } from "@/shared/locale/namespaces/define-namespace";
import { getNamespaceId } from "@/shared/locale/namespaces/define-namespace";

const namespaceRegistry = new Map<string, NamespaceLoaderConfig<unknown>>();

export function registerNamespace<TLabels>(
  handle: NamespaceHandle<TLabels>,
  config: NamespaceLoaderConfig<TLabels>
): void {
  const key = getNamespaceId(handle) ?? handle.toString();
  namespaceRegistry.set(key, config);
}

function narrowConfig<TLabels>(
  config: NamespaceLoaderConfig<unknown> | undefined
): NamespaceLoaderConfig<TLabels> | undefined {
  return config as NamespaceLoaderConfig<TLabels> | undefined;
}

export function getNamespaceConfig<TLabels>(
  handle: NamespaceHandle<TLabels>
): NamespaceLoaderConfig<TLabels> | undefined {
  const key = getNamespaceId(handle) ?? handle.toString();
  return narrowConfig(namespaceRegistry.get(key));
}
