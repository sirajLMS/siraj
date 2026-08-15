export interface OAuthFlowLabels {
  readonly connectingTo: (provider: string) => string;
  readonly redirectingToProvider: (provider: string) => string;
  readonly connectionSuccessful: string;
  readonly connectionFailed: string;
  readonly tokenExpired: string;
  readonly tokenExpiringSoon: string;
  readonly reconnectNow: string;
  readonly remindMeLater: string;
  readonly statusConnected: string;
  readonly statusNotConnected: string;
  readonly statusExpiring: string;
  readonly statusExpired: string;
  readonly expiresInDays: (days: number) => string;
  readonly statusAriaLabel: string;
}
