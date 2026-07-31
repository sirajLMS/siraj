import type { AppLocale } from "@/shared/locale/AppLocale";
import { registerNamespace } from "@/shared/locale/client/namespace-registry";

const NAMESPACE_ID_SYMBOL = Symbol.for("siraj.namespace.id");

export interface NamespaceHandle<TLabels> {
  readonly __labels?: TLabels;
  readonly [NAMESPACE_ID_SYMBOL]?: string;
}

export interface NamespaceLoaderConfig<TLabels> {
  readonly load: Record<AppLocale, () => Promise<TLabels>>;
}

export function defineNamespace<TLabels>(id: string, config: NamespaceLoaderConfig<TLabels>): NamespaceHandle<TLabels>;
export function defineNamespace<TLabels>(config: NamespaceLoaderConfig<TLabels>): NamespaceHandle<TLabels>;
export function defineNamespace<TLabels>(
  idOrConfig: string | NamespaceLoaderConfig<TLabels>,
  maybeConfig?: NamespaceLoaderConfig<TLabels>
): NamespaceHandle<TLabels> {
  const id = typeof idOrConfig === "string" ? idOrConfig : undefined;
  const config = (typeof idOrConfig === "string" ? maybeConfig : idOrConfig) as NamespaceLoaderConfig<TLabels>;

  const handle = {} as NamespaceHandle<TLabels>;
  if (id) {
    Object.defineProperty(handle, NAMESPACE_ID_SYMBOL, {
      value: id,
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }
  registerNamespace(handle, config);
  return handle;
}

export function getNamespaceId(handle: NamespaceHandle<unknown>): string | undefined {
  return handle[NAMESPACE_ID_SYMBOL];
}
