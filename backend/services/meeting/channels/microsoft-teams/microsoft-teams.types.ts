export interface MicrosoftTeamsTokenResponse {
  readonly token_type: string;
  readonly expires_in: number;
  readonly access_token: string;
  readonly scope?: string;
}

export interface MicrosoftTeamsMeetingResponse {
  readonly id: string;
  readonly joinWebUrl: string;
  readonly subject?: string;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly joinMeetingIdSettings?: {
    readonly joinMeetingId?: string;
    readonly passcode?: string;
  };
}

export interface MicrosoftTeamsErrorResponse {
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly innerError?: {
      readonly "request-id"?: string;
      readonly date?: string;
    };
  };
}
