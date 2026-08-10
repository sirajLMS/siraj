import type { NamespaceHandle, NamespaceLoaderConfig } from "@/shared/locale/namespaces/define-namespace";
import { getNamespaceId } from "@/shared/locale/namespaces/define-namespace";

const namespaceRegistry = new Map<string, NamespaceLoaderConfig<unknown>>();

export function registerNamespace<TLabels>(
  handle: NamespaceHandle<TLabels>,
  config: NamespaceLoaderConfig<TLabels>
): void {
  const key = getNamespaceId(handle);
  if (key === undefined) {
    throw new Error("Namespace handle must have a stable id before registration");
  }
  namespaceRegistry.set(key, config);
}

function isNamespaceLoaderConfig<TLabels>(
  config: NamespaceLoaderConfig<unknown> | undefined
): config is NamespaceLoaderConfig<TLabels> | undefined {
  return config !== undefined;
}

function narrowConfig<TLabels>(
  config: NamespaceLoaderConfig<unknown> | undefined
): NamespaceLoaderConfig<TLabels> | undefined {
  if (!isNamespaceLoaderConfig<TLabels>(config)) return undefined;
  return config;
}

export function getNamespaceConfig<TLabels>(
  handle: NamespaceHandle<TLabels>
): NamespaceLoaderConfig<TLabels> | undefined {
  const key = getNamespaceId(handle);
  if (key === undefined) {
    return undefined;
  }
  return narrowConfig(namespaceRegistry.get(key));
}
