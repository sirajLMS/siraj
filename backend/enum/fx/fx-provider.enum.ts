export enum FxProvider {
  OpenExchangeRates = "openexchangerates",
  Fixer = "fixer",
}

export enum FxSyncStatus {
  Running = "running",
  Success = "success",
  Partial = "partial",
  Failed = "failed",
}

export enum FxSyncTrigger {
  Cron = "cron",
  Manual = "manual",
}

export enum FxProviderConfigSource {
  ENV = "env",
  DATABASE = "database",
}
