const namespaceRegistry = new Map();
export function registerNamespace(handle, config) {
  namespaceRegistry.set(handle, config);
}
export function getNamespaceConfig(handle) {
  return namespaceRegistry.get(handle);
}
