import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { FxProvider, FxProviderConfigSource } from "@/backend/enum/fx/fx-provider.enum";
import { getStringEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import type { IFxRateProvider } from "@/backend/services/fx/providers/IFxRateProvider";
import type { FxProviderFetchResult } from "@/backend/types";

const FX_PROVIDER_SETTING_KEY = "fx_provider";

let instance: IFxRateProvider | null = null;
let initializationPromise: Promise<IFxRateProvider> | null = null;
let cachedProviderName: FxProvider | null = null;

const validProviders: FxProvider[] = [FxProvider.OpenExchangeRates, FxProvider.Fixer];

function isFxProvider(value: string): value is FxProvider {
  return validProviders.some(provider => (provider as string) === value);
}

function normalizeProvider(raw: string): FxProvider | null {
  const normalized = raw.toLowerCase();
  return isFxProvider(normalized) ? normalized : null;
}

/**
 * Read the configured FX provider from the environment. Defaults to
 * OpenExchangeRates when unset or unrecognised.
 */
function getFxProviderFromEnv(): FxProvider {
  const raw = (getStringEnv("FX_PROVIDER") ?? "openexchangerates").toLowerCase();
  const provider = normalizeProvider(raw);

  if (!provider) {
    logger.warn(
      `Invalid FX_PROVIDER: ${raw}. Must be one of ${validProviders.join(", ")}. Defaulting to ${FxProvider.OpenExchangeRates}.`
    );
    return FxProvider.OpenExchangeRates;
  }

  return provider;
}

export async function getResolvedFxProviderConfig(): Promise<{
  readonly provider: FxProvider;
  readonly source: FxProviderConfigSource;
}> {
  const dbValue = await SystemSettingsRepository.getStringValue(FX_PROVIDER_SETTING_KEY, "");
  const dbProvider = dbValue ? normalizeProvider(dbValue) : null;

  if (dbProvider) {
    return { provider: dbProvider, source: FxProviderConfigSource.DATABASE };
  }

  return { provider: getFxProviderFromEnv(), source: FxProviderConfigSource.ENV };
}

/**
 * Dispatch table mapping a provider enum value to its lazy-async creator.
 * Each creator dynamically imports its adapter so the bundle only pays for
 * the provider actually in use.
 */
const adapterFactories: Record<FxProvider, () => Promise<IFxRateProvider>> = {
  [FxProvider.OpenExchangeRates]: async () => {
    const { OpenExchangeRatesAdapter } = await import(
      "@/backend/services/fx/providers/openexchangerates/OpenExchangeRatesAdapter"
    );
    return new OpenExchangeRatesAdapter();
  },
  [FxProvider.Fixer]: async () => {
    const { FixerAdapter } = await import("@/backend/services/fx/providers/fixer/FixerAdapter");
    return new FixerAdapter();
  },
};

/**
 * Get the configured FX rate provider singleton. Mirrors the
 * `EmailChannelFactory` async lazy singleton: the in-flight promise is
 * cached and reset on failure so subsequent callers can retry.
 */
export const getFxRateProvider = async (): Promise<IFxRateProvider> => {
  const { provider } = await getResolvedFxProviderConfig();

  if (instance && cachedProviderName === provider) {
    return instance;
  }

  if (cachedProviderName !== provider) {
    resetFxRateProvider();
  }

  initializationPromise ??= (async () => {
    try {
      logger.info(`Initializing FX rate provider: ${provider}`);
      const factory = adapterFactories[provider];
      const adapter = await factory();
      instance = adapter;
      cachedProviderName = provider;
      return instance;
    } catch (error) {
      initializationPromise = null;
      logger.error("Failed to initialize FX rate provider", error);
      throw error;
    }
  })();

  return initializationPromise;
};

/**
 * Reset the singleton instance. Useful for tests and for forcing a
 * re-initialisation after env changes.
 */
export const resetFxRateProvider = (): void => {
  instance = null;
  initializationPromise = null;
  cachedProviderName = null;
};

/**
 * Facade object that delegates to the singleton. This is the public surface
 * most consumers should import — they never need to await `getFxRateProvider`
 * directly.
 */
export const fxRateProvider = {
  fetchLatestRates: async (locale?: string): Promise<FxProviderFetchResult> => {
    const provider = await getFxRateProvider();
    return provider.fetchLatestRates(locale);
  },
  validateConfig: async (): Promise<boolean> => {
    const provider = await getFxRateProvider();
    return provider.validateConfig();
  },
};
