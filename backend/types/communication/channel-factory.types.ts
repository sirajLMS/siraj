/**
 * Minimal channel interface shared by all communication channels.
 * Every channel adapter (email, push, sms, whatsapp) implements these three methods.
 * Relocated from backend/services/communication/channels/__shared__/channelFactoryBase.ts (R2).
 */
export interface ChannelLifecycle {
  send(payload: unknown, locale?: string): Promise<unknown>;
  validateConfig(): Promise<boolean>;
  disconnect(): Promise<void>;
}

export interface ChannelFactoryConfig<TChannel extends ChannelLifecycle> {
  readonly channelName: string;
  readonly providerEnvKey: string;
  readonly defaultProvider: string;
  readonly cacheKeysToInvalidate: readonly string[];
  readonly createAdapter: () => Promise<TChannel>;
  readonly validateProvider?: (rawProvider: string) => string;
}

export interface ChannelFactory<TChannel extends ChannelLifecycle> {
  readonly getChannel: () => Promise<TChannel>;
  readonly resetChannel: () => void;
  readonly channel: {
    send: TChannel["send"];
    validateConfig: TChannel["validateConfig"];
    disconnect: TChannel["disconnect"];
  };
}
