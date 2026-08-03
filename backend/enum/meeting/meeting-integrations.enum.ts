export enum MeetingConnectionTestMode {
  VALIDATE_CONFIG = "VALIDATE_CONFIG",
  GENERATE_AND_DELETE = "GENERATE_AND_DELETE",
}

export enum MeetingIntegrationConnectedAccountStatus {
  CONNECTED = "connected",
  EXPIRING_SOON = "expiring_soon",
  REAUTH_NEEDED = "reauth_needed",
  REVOKED = "revoked",
}

export enum MeetingIntegrationProviderSlug {
  ZOOM = "zoom",
  GOOGLE_MEET = "google_meet",
  MICROSOFT_TEAMS = "microsoft_teams",
}
