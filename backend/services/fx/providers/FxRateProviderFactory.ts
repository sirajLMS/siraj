import { FxProvider } from "@/backend/enum/fx/fx-provider.enum";
import { getStringEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import type { IFxRateProvider } from "@/backend/services/fx/providers/IFxRateProvider";
import type { FxProviderFetchResult } from "@/backend/types";

let instance: IFxRateProvider | null = null;
let initializationPromise: Promise<IFxRateProvider> | null = null;

/**
 * Read the configured FX provider from the environment. Defaults to
 * OpenExchangeRates when unset or unrecognised.
 */
function getFxProvider(): FxProvider {
  const raw = (getStringEnv("FX_PROVIDER") ?? "openexchangerates").toLowerCase();

  const validProviders: FxProvider[] = [FxProvider.OpenExchangeRates, FxProvider.Fixer];
  if (!validProviders.includes(raw as FxProvider)) {
    logger.warn(
      `Invalid FX_PROVIDER: ${raw}. Must be one of ${validProviders.join(", ")}. Defaulting to ${FxProvider.OpenExchangeRates}.`
    );
    return FxProvider.OpenExchangeRates;
  }

  return raw as FxProvider;
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
  if (instance) {
    return instance;
  }

  initializationPromise ??= (async () => {
    try {
      const provider = getFxProvider();
      logger.info(`Initializing FX rate provider: ${provider}`);
      const factory = adapterFactories[provider];
      const adapter = await factory();
      instance = adapter;
      return instance;
    } catch (error) {
      // Reset promise on failure so subsequent calls can try again.
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
