export interface ZoomTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in: number;
  readonly scope: string;
  readonly api_url?: string;
}

export interface ZoomMeetingResponse {
  readonly id: number;
  readonly uuid?: string;
  readonly topic: string;
  readonly start_time?: string;
  readonly duration?: number;
  readonly join_url: string;
  readonly start_url?: string;
  readonly password?: string;
}

export interface ZoomErrorResponse {
  readonly code: number;
  readonly message: string;
}
