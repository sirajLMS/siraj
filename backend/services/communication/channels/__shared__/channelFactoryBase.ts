import { logger } from "@/backend/lib/logger";
import { invalidateEnvConfigCache, resolveEnvConfig, resolveEnvConfigMany } from "@/backend/services/system";

/**
 * Minimal channel interface shared by all communication channels.
 * Every channel adapter (email, push, sms, whatsapp) implements these three methods.
 */
export interface ChannelLifecycle {
  send(payload: unknown, locale?: string): Promise<unknown>;
  validateConfig(): Promise<boolean>;
  disconnect(): Promise<void>;
}

/**
 * Configuration for the generic channel factory.
 *
 * @template TChannel - The channel interface (e.g. `IEmailChannel`, `IPushChannel`)
 */
export interface ChannelFactoryConfig<TChannel extends ChannelLifecycle> {
  /** Human-readable channel name for log messages (e.g. "Email", "Push", "SMS"). */
  readonly channelName: string;
  /** Environment variable key for provider selection (e.g. "EMAIL_PROVIDER"). */
  readonly providerEnvKey: string;
  /** Default provider when the env key is unset (e.g. "resend", "fcm", "twilio"). */
  readonly defaultProvider: string;
  /** Env-config keys to invalidate on reset (e.g. ["EMAIL_PROVIDER", "RESEND_API_KEY", ...]). */
  readonly cacheKeysToInvalidate: readonly string[];
  /**
   * Creates the channel adapter for the resolved provider.
   * Receives `resolveEnvConfig` and `resolveEnvConfigMany` for credential resolution.
   * Should dynamic-import the adapter module and resolve required env vars.
   */
  readonly createAdapter: () => Promise<TChannel>;
  /**
   * Optional custom provider validator.
   * When provided, receives the raw resolved provider string and should return
   * the validated provider or throw/return a fallback.
   * When omitted, the default validation checks that the provider matches `defaultProvider`.
   */
  readonly validateProvider?: (rawProvider: string) => string;
}

/**
 * Return type of {@link createChannelFactory} — the public API of a channel factory.
 */
export interface ChannelFactory<TChannel extends ChannelLifecycle> {
  /** Lazy singleton accessor — returns the cached instance or initializes it. */
  readonly getChannel: () => Promise<TChannel>;
  /** Tears down the singleton and invalidates env-config caches. */
  readonly resetChannel: () => void;
  /** Facade delegating `send`/`validateConfig`/`disconnect` to the singleton. */
  readonly channel: {
    send: TChannel["send"];
    validateConfig: TChannel["validateConfig"];
    disconnect: TChannel["disconnect"];
  };
}

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

/**
 * Creates a complete channel factory with singleton lifecycle, provider resolution,
 * reset/cache-invalidation, and a facade that delegates to the underlying adapter.
 *
 * This eliminates the ~80 lines of boilerplate duplicated across email, push,
 * and SMS channel factories. Each channel-specific factory calls this function
 * with its config, keeping only the adapter-creation logic.
 *
 * @template TChannel - The channel interface type
 */
export function createChannelFactory<TChannel extends ChannelLifecycle>(
  config: ChannelFactoryConfig<TChannel>
): ChannelFactory<TChannel> {
  let instance: TChannel | null = null;
  let initializationPromise: Promise<TChannel> | null = null;

  const resolveProvider = async (): Promise<string> => {
    const rawProvider = (await resolveEnvConfig(config.providerEnvKey)) || config.defaultProvider;

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

/**
 * Convenience re-export so channel factories don't need a separate import
 * for `resolveEnvConfigMany` when resolving adapter credentials.
 */
export { resolveEnvConfig, resolveEnvConfigMany };
