export { type AppLocale, defaultLocale, locales } from "./AppLocale";
export {
  getNamespaceConfig,
  preloadNamespaces,
  readTranslation,
  registerNamespace,
  TranslationProvider,
  type TranslationProviderProps,
  useTranslation,
} from "./client";
export { useAppTranslation } from "./client/use-app-translation";
export { LocaleContext, type LocaleContextValue, useAppLocale, useLocaleContext } from "./localeContext";
export {
  AuthLogin,
  defineNamespace,
  type NamespaceHandle,
  type NamespaceLoaderConfig,
  Translation,
} from "./namespaces";
export { getTranslations, loadAllTranslations } from "./server";
export { getServerTranslations } from "./server-graphql";
export * from "./types";
