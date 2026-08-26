import { logger } from "@/backend/lib/logger";
import { invalidateEnvConfigCache, resolveEnvConfig } from "@/backend/services/system";
import type { ChannelFactory, ChannelFactoryConfig, ChannelLifecycle } from "@/backend/types";

/**
 * Default provider validation: logs a warning and falls back to `defaultProvider`
 * when the resolved provider doesn't match the expected value.
 */
function defaultValidateProvider(rawProvider: string, defaultProvider: string, providerEnvKey: string): string {
  const provider = rawProvider.toLowerCase();

  if (provider !== defaultProvider) {
    logger.warn(`Invalid ${providerEnvKey}: ${provider}. Must be '${defaultProvider}'. Using '${defaultProvider}'.`);
    return defaultProvider;
  }

  return provider;
}

export function createChannelFactory<TChannel extends ChannelLifecycle>(
  config: ChannelFactoryConfig<TChannel>
): ChannelFactory<TChannel> {
  let instance: TChannel | null = null;
  let initializationPromise: Promise<TChannel> | null = null;

  const resolveProvider = async (): Promise<string> => {
    const rawProvider = (await resolveEnvConfig(config.providerEnvKey)) ?? config.defaultProvider;

    if (config.validateProvider) {
      return config.validateProvider(rawProvider);
    }

    return defaultValidateProvider(rawProvider, config.defaultProvider, config.providerEnvKey);
  };

  const createChannel = async (): Promise<TChannel> => {
    const provider = await resolveProvider();

    logger.info(`Initializing ${config.channelName} channel with provider: ${provider}`);

    if (provider !== config.defaultProvider) {
      logger.warn(
        `Unknown ${config.channelName.toLowerCase()} provider: ${provider}, falling back to ${config.defaultProvider}`
      );
    }

    return config.createAdapter();
  };

  const getChannel = async (): Promise<TChannel> => {
    if (instance) {
      return instance;
    }

    initializationPromise ??= (async () => {
      try {
        const service = await createChannel();
        instance = service;
        return instance;
      } catch (error) {
        initializationPromise = null;
        logger.error(`Failed to initialize ${config.channelName} channel`, error);
        throw error;
      }
    })();

    return initializationPromise;
  };

  const resetChannel = (): void => {
    if (instance) {
      void instance.disconnect();
      instance = null;
    }
    initializationPromise = null;
    for (const key of config.cacheKeysToInvalidate) {
      invalidateEnvConfigCache(key);
    }
  };

  const channel: {
    send: TChannel["send"];
    validateConfig: TChannel["validateConfig"];
    disconnect: TChannel["disconnect"];
  } = {
    send: async (payload: Parameters<TChannel["send"]>[0], locale?: string) => {
      const service = await getChannel();
      return service.send(payload, locale);
    },
    validateConfig: async () => {
      const service = await getChannel();
      return service.validateConfig();
    },
    disconnect: async () => {
      const service = await getChannel();
      return service.disconnect();
    },
  };

  return { getChannel, resetChannel, channel };
}
